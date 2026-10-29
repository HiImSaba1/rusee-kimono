import { chmod, lstat, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const applicationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseDirectories = ["drizzle", "public", "scripts", "src"];
const releaseFiles = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "next-env.d.ts",
  "drizzle.config.ts",
  "start.js",
  ".node-version",
];

let directoriesUpdated = 0;
let filesUpdated = 0;

async function repairTree(path) {
  const details = await lstat(path);
  if (details.isSymbolicLink()) throw new Error("Release source must not contain symbolic links.");
  if (!details.isDirectory()) throw new Error("Expected a release directory.");

  await chmod(path, 0o755);
  directoriesUpdated += 1;

  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Release source must not contain symbolic links.");
    if (entry.isDirectory()) {
      await repairTree(child);
    } else if (entry.isFile()) {
      await chmod(child, 0o644);
      filesUpdated += 1;
    } else {
      throw new Error("Release source contains an unsupported filesystem entry.");
    }
  }
}

for (const directory of releaseDirectories) await repairTree(join(applicationRoot, directory));
for (const file of releaseFiles) {
  const path = join(applicationRoot, file);
  const details = await lstat(path);
  if (!details.isFile() || details.isSymbolicLink()) throw new Error("Expected a regular release file.");
  await chmod(path, 0o644);
  filesUpdated += 1;
}

console.log(`Release permissions repaired: ${directoriesUpdated} directories set to 755; ${filesUpdated} files set to 644.`);
console.log("Private environment files, node_modules and .next were not inspected or changed.");
