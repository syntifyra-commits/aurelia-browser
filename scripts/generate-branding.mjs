// Generates the Aurelia branding image set for configs/branding/release/
// from design/aurelia-logo.svg using sharp. ICOs are built as PNG-compressed
// ICO containers (supported since Vista).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "configs", "branding", "release");
const contentDir = join(outDir, "content");
mkdirSync(contentDir, { recursive: true });

const svgTemplate = readFileSync(join(root, "design", "aurelia-logo.svg"), "utf8");
const svgFor = (size) =>
  Buffer.from(svgTemplate.replace("__STROKE__", size <= 32 ? "84" : "44"));

const render = (size) =>
  sharp(svgFor(size), { density: 300 }).resize(size, size).png().toBuffer();

const sizes = [16, 22, 24, 32, 48, 64, 128, 256, 512, 1024];
const pngs = {};
for (const s of sizes) pngs[s] = await render(s);

for (const s of sizes) writeFileSync(join(outDir, `logo${s}.png`), pngs[s]);
writeFileSync(join(outDir, "logo.png"), pngs[512]);
writeFileSync(join(outDir, "logo-mac.png"), pngs[512]);
writeFileSync(join(contentDir, "about-logo.png"), pngs[512]);
writeFileSync(join(contentDir, "about-logo@2x.png"), pngs[1024]);
writeFileSync(join(contentDir, "about-logo.svg"), svgTemplate.replace("__STROKE__", "44"));

function buildIco(pngBySize, sizes) {
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const entries = [];
  const blobs = [];
  let offset = 6 + 16 * count;
  for (const s of sizes) {
    const data = pngBySize[s];
    const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0); // width (0 = 256)
    e.writeUInt8(s >= 256 ? 0 : s, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
    blobs.push(data);
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

writeFileSync(join(outDir, "firefox.ico"), buildIco(pngs, [16, 24, 32, 48, 64, 256]));
writeFileSync(join(outDir, "firefox64.ico"), buildIco(pngs, [64]));

console.log("Aurelia branding generated in", outDir);
