import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const applicationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = join(applicationRoot, ".next", "standalone");
const copies = [
  [join(applicationRoot, ".next", "static"), join(standaloneRoot, ".next", "static")],
  [join(applicationRoot, "public"), join(standaloneRoot, "public")],
  [join(applicationRoot, "scripts", "run-automation-worker.mjs"), join(standaloneRoot, "scripts", "run-automation-worker.mjs")],
  [join(applicationRoot, "scripts", "check-production-site.mjs"), join(standaloneRoot, "scripts", "check-production-site.mjs")],
  [join(applicationRoot, "scripts", "pre-bank-readiness-audit.mjs"), join(standaloneRoot, "scripts", "pre-bank-readiness-audit.mjs")],
];

const standaloneDetails = await stat(join(standaloneRoot, "server.js"));
if (!standaloneDetails.isFile()) throw new Error("The standalone server is missing. Run the production build first.");

for (const [source, destination] of copies) {
  const sourceDetails = await stat(source);
  if (!sourceDetails.isDirectory() && !sourceDetails.isFile()) throw new Error("A required standalone asset or operational script is missing.");
  if (sourceDetails.isDirectory()) {
    await mkdir(destination, { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
  } else {
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
  }
}

console.log("Standalone runtime prepared with built assets, public media and reviewed private operational scripts.");
