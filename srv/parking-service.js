const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {
  const { Spots, Zones } = this.entities;

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
    if (!spot) req.error(404, "Parking spot not found");

    const newStatus = spot.status === "OCCUPIED" ? "FREE" : "OCCUPIED";

    await UPDATE(Spots)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where({ ID });

    return await SELECT.one.from(Spots).where({ ID });
  });
});
