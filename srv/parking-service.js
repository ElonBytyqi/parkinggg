const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {
  const { Spots, Zones, CreditWallets } = this.entities;

  // Default sorting for Zones by name
  this.on("READ", Zones, async (req, next) => {
    if (!req.query?.SELECT?.orderBy) {
      req.query.orderBy({ ref: ["name"], sort: "asc" });
    }
    return next();
  });

  // Default sorting for Spots by number
  this.on("READ", Spots, async (req, next) => {
    if (!req.query?.SELECT?.orderBy) {
      req.query.orderBy({ ref: ["number"], sort: "asc" });
    }
    return next();
  });

  // Action: toggleStatus (UPDATE)
this.on("toggleStatus", async (req) => {
  const { ID } = req.data;

  const spot = await SELECT.one.from(Spots).where({ ID });
  if (!spot) return req.reject(404, "Parking spot not found");

  const newStatus = spot.status === "OCCUPIED" ? "FREE" : "OCCUPIED";

  const updateData =
    newStatus === "FREE"
      ? {
          status: "FREE",
          plate: null,
          reservedHours: null,
          amount: null,
          credits: null,
          paymentMethod: null,
          expiresAt: null,
          updatedAt: new Date().toISOString()
        }
      : {
          status: "OCCUPIED",
          updatedAt: new Date().toISOString()
        };

  await UPDATE(Spots).set(updateData).where({ ID });

  return await SELECT.one.from(Spots).where({ ID });
});


  this.on("deductCredits", async (req) => {
    const { ID, amountCredits } = req.data;

    const amount = Number(amountCredits);
    if (!ID) return req.reject(400, "Wallet ID is required");
    if (!Number.isInteger(amount) || amount <= 0) {
      return req.reject(400, "Credit amount must be a positive integer");
    }

    const wallet = await SELECT.one.from(CreditWallets).where({ ID });
    if (!wallet) return req.reject(404, "Credit wallet not found");

    const currentBalance = Number(wallet.creditBalance || 0);
    if (currentBalance < amount) {
      return req.reject(400, "Insufficient credits");
    }

    await UPDATE(CreditWallets)
      .set({
        creditBalance: currentBalance - amount,
        updatedAt: new Date().toISOString()
      })
      .where({ ID });

    return await SELECT.one.from(CreditWallets).where({ ID });
  });

  this.on("reserveSpot", async (req) => {
    const { ID, plate, hours, amount, credits, paymentMethod } = req.data;

    const spot = await SELECT.one.from(Spots).where({ ID });
    if (!spot) return req.reject(404, "Parking spot not found");

    if (spot.status !== "FREE") {
      return req.reject(409, "Parking spot is already occupied");
    }

    const numericHours = Number(hours || 0);
    const expiresAt = new Date(Date.now() + numericHours * 60 * 60 * 1000).toISOString();

    await UPDATE(Spots)
      .set({
        status: "OCCUPIED",
        plate,
        reservedHours: numericHours,
        amount,
        credits,
        paymentMethod,
        expiresAt,
        updatedAt: new Date().toISOString()
      })
      .where({ ID });

    return await SELECT.one.from(Spots).where({ ID });
  });

  this.on("releaseSpot", async (req) => {
    const { ID } = req.data;

    const spot = await SELECT.one.from(Spots).where({ ID });
    if (!spot) return req.reject(404, "Parking spot not found");

    await UPDATE(Spots)
      .set({
        status: "FREE",
        plate: null,
        reservedHours: null,
        amount: null,
        credits: null,
        paymentMethod: null,
        expiresAt: null,
        updatedAt: new Date().toISOString()
      })
      .where({ ID });

    return await SELECT.one.from(Spots).where({ ID });
  });
});
