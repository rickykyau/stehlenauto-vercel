// Preload that (1) stubs `server-only` for tsx scripts, and (2) loads
// .env.local + .env BEFORE any project module evaluates so env-at-import-time
// reads (e.g. shopifyAdminConfigured, dbConfigured) see the right values.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const Module = require("module");
const orig = Module._load;
Module._load = function (req, ...rest) {
  if (req === "server-only") return {};
  return orig.call(this, req, ...rest);
};
