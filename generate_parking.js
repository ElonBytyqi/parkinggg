const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const filePath = path.join("db", "data", "parking-Spots.csv");
const walletsFilePath = path.join("db", "data", "parking-CreditWallets.csv");
let out = "ID;name;number;status;updatedAt\n";

for (let i = 1; i <= 100; i++) {
  out += `${randomUUID()};P${i};${i};FREE;2026-01-20T00:00:00Z\n`;
}

fs.writeFileSync(filePath, out, "utf8");
let walletsOut = "ID;owner;creditBalance;updatedAt\n";
walletsOut += "99999999-9999-9999-9999-999999999999;Visitor Demo;500;2026-01-20T00:00:00Z\n";

fs.writeFileSync(walletsFilePath, walletsOut, "utf8");
console.log("✅ u krijua CSV me number (1..100)");
