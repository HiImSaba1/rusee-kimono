import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceDirectory = path.join(projectRoot, "public", "kimono_images");
const outputDirectory = path.join(projectRoot, "public", "kimono_images_optimized");
const maximumBytes = 500 * 1024;
const minimumQuality = 35;
const maximumQuality = 95;
const minimumWidth = 640;
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

const formatSize = bytes => `${(bytes / 1024).toFixed(1)} KB`;

async function encodeAtQuality(inputPath, quality, width) {
  return sharp(inputPath, { failOn: "warning" })
    .rotate()
    .resize({ width, withoutEnlargement: true, fit: "inside" })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer();
}

async function optimizeImage(inputPath) {
  const metadata = await sharp(inputPath, { failOn: "warning" }).metadata();
  let targetWidth = metadata.autoOrient?.width ?? metadata.width;
  if (!targetWidth) throw new Error("Sharp could not determine the image width.");

  while (targetWidth >= minimumWidth) {
    let low = minimumQuality;
    let high = maximumQuality;
    let bestBuffer;
    while (low <= high) {
      const quality = Math.floor((low + high) / 2);
      const candidate = await encodeAtQuality(inputPath, quality, targetWidth);
      if (candidate.length <= maximumBytes) {
        bestBuffer = candidate;
        low = quality + 1;
      } else {
        high = quality - 1;
      }
    }
    if (bestBuffer) return bestBuffer;
    targetWidth = Math.floor(targetWidth * 0.9);
  }
  throw new Error("Could not reduce this image below 500 KB safely.");
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const entries = (await readdir(sourceDirectory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
  if (!entries.length) throw new Error(`No supported images found in ${sourceDirectory}`);

  const outputNames = entries.map(entry => `${path.parse(entry.name).name}.webp`);
  if (new Set(outputNames.map(name => name.toLocaleLowerCase())).size !== outputNames.length) {
    throw new Error("Two source images would produce the same WebP filename. No images were written.");
  }

  console.log(`Optimizing ${entries.length} kimono images (maximum ${formatSize(maximumBytes)})...`);
  const manifest = [];
  const failures = [];
  let fallbackCount = 0;
  for (const [index, entry] of entries.entries()) {
    const inputPath = path.join(sourceDirectory, entry.name);
    const outputName = outputNames[index];
    const outputPath = path.join(outputDirectory, outputName);
    try {
      const original = await stat(inputPath);
      const optimized = await optimizeImage(inputPath);
      if (optimized.length > maximumBytes) throw new Error(`Output is ${formatSize(optimized.length)}, above the limit.`);
      await writeFile(outputPath, optimized);
      manifest.push({ source: entry.name, output: outputName, bytes: optimized.length });
      console.log(`OK ${entry.name} -> ${outputName} | ${formatSize(original.size)} -> ${formatSize(optimized.length)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        const original = await stat(inputPath);
        const fallbackName = entry.name;
        await copyFile(inputPath, path.join(outputDirectory, fallbackName));
        manifest.push({ source: entry.name, output: fallbackName, bytes: original.size, fallback: true });
        fallbackCount += 1;
        console.warn(`FALLBACK ${entry.name} -> ${fallbackName} | ${formatSize(original.size)} | WebP conversion: ${message}`);
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        failures.push(`${entry.name}: ${message}; fallback copy failed: ${fallbackMessage}`);
        console.error(`FAIL ${entry.name} | ${message}; fallback copy failed: ${fallbackMessage}`);
      }
    }
  }
  if (failures.length) throw new Error(`${failures.length} image(s) failed optimization. Application paths were not changed.`);
  await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`PASS - ${manifest.length - fallbackCount} WebP images are at or below 500 KB; ${fallbackCount} original-format fallback image(s) were copied as approved.`);
  console.log(`Output: ${outputDirectory}`);
  console.log("Application and database paths still point to the current source library until separately updated.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
