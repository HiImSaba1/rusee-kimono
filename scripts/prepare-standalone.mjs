import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const applicationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneRoot = join(applicationRoot, ".next", "standalone");
const copies = [
  [join(applicationRoot, ".next", "static"), join(standaloneRoot, ".next", "static")],
  [join(applicationRoot, "public"), join(standaloneRoot, "public")],
];

const standaloneDetails = await stat(join(standaloneRoot, "server.js"));
if (!standaloneDetails.isFile()) throw new Error("The standalone server is missing. Run the production build first.");

for (const [source, destination] of copies) {
  const sourceDetails = await stat(source);
  if (!sourceDetails.isDirectory()) throw new Error("A required standalone asset directory is missing.");
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

console.log("Standalone runtime prepared with the built static assets and reviewed public directory.");
