const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const filePath = path.join("db", "data", "parking-Spots.csv");

let out = "ID;name;number;status;updatedAt\n";

for (let i = 1; i <= 100; i++) {
  out += `${randomUUID()};P${i};${i};FREE;2026-01-20T00:00:00Z\n`;
}

fs.writeFileSync(filePath, out, "utf8");
console.log("✅ u krijua CSV me number (1..100)");
