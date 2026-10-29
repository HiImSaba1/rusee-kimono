/* eslint-disable @typescript-eslint/no-require-imports -- Plesk executes this startup adapter directly as CommonJS. */
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

// Plesk/Passenger launches this file from the private application root.
// Panel-supplied values take precedence over the optional private env file.
const productionEnvironmentPath = resolve(__dirname, ".env.production.local");
if (existsSync(productionEnvironmentPath)) {
  if (typeof process.loadEnvFile !== "function") {
    throw new Error("Node.js 20.12 or newer is required to load .env.production.local.");
  }
  process.loadEnvFile(productionEnvironmentPath);
}

// The Papaki build must have produced the standalone bundle before restart.
require("./.next/standalone/server.js");
