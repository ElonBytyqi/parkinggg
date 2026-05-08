const cds = require("@sap/cds");
const express = require("express");
const path = require("path");

cds.on("bootstrap", (app) => {
  const frontendDist = path.join(__dirname, "app", "parking-web", "dist");

  app.use(express.static(frontendDist));

  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/odata")) {
      return next();
    }

    if (req.path.startsWith("/-/")) {
      return next();
    }

    res.sendFile(path.join(frontendDist, "index.html"));
  });
});

module.exports = cds.server;