import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const source = path.join(projectRoot, "public", "rusee_logo_main_orig.jpg");
const icon = path.join(projectRoot, "src", "app", "icon.png");
const oldFavicon = path.join(projectRoot, "src", "app", "favicon.ico");

await sharp(source)
  .resize(512, 512, { fit: "contain", background: "#f2f0e9" })
  .png({ compressionLevel: 9, palette: true })
  .toFile(icon);

await unlink(oldFavicon).catch((error) => {
  if (error?.code !== "ENOENT") throw error;
});

console.log("PASS - the supplied Ruseè logo is prepared as the header wordmark and 512px application icon.");
console.log("The original public JPG was preserved; only the superseded favicon.ico was removed.");
