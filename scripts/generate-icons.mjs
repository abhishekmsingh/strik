#!/usr/bin/env node
/**
 * Renders the brand SVG into crisp PNGs at the sizes Android splash + iOS
 * Home Screen + browser favicon all need. Run after editing icon.svg or the
 * maskable source below.
 *
 *   node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SERIF =
  'Instrument Serif, "Iowan Old Style", "Apple Garamond", Georgia, serif';

const anySvg = await readFile(resolve(root, "public/icon.svg"));

// Maskable purpose: Android adaptive icons may crop the canvas to any shape
// (circle, squircle, rounded square). The safe zone is the centered 80% box.
// We fill the whole canvas with lavender so any crop still shows brand color,
// and shrink the glyph so it stays inside the safe zone.
const maskableSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#5941a9"/>
  <text x="256" y="350" font-family='${SERIF}'
        font-size="300" font-weight="400" text-anchor="middle" fill="#fbfaf7">&amp;</text>
</svg>`);

// Android requires the status-bar notification icon (the "badge") to be a
// solid-white silhouette on a transparent background. Anything else gets
// rendered as a generic square. Same glyph, no background, pure white.
const badgeSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <text x="48" y="74" font-family='${SERIF}'
        font-size="86" font-weight="400" text-anchor="middle" fill="#ffffff">&amp;</text>
</svg>`);

const outputs = [
  { src: anySvg, size: 192, file: "public/icons/icon-192.png" },
  { src: anySvg, size: 512, file: "public/icons/icon-512.png" },
  { src: maskableSvg, size: 512, file: "public/icons/icon-maskable-512.png" },
  // status-bar badge for Android push notifications (monochrome, transparent)
  { src: badgeSvg, size: 96, file: "public/icons/badge-96.png" },
  // app/icon.png and app/apple-icon.png are auto-linked by Next.js metadata.
  { src: anySvg, size: 512, file: "app/icon.png" },
  { src: anySvg, size: 180, file: "app/apple-icon.png" },
];

await mkdir(resolve(root, "public/icons"), { recursive: true });

for (const { src, size, file } of outputs) {
  const out = resolve(root, file);
  // density:1200 rasterizes the SVG at high DPI before sharp resizes,
  // so text edges stay smooth at every output size.
  const buf = await sharp(src, { density: 1200 })
    .resize(size, size, { kernel: "lanczos3", fit: "contain" })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();
  await writeFile(out, buf);
  console.log(`  ${file.padEnd(40)} ${String(size).padStart(4)}px (${buf.length.toLocaleString()} bytes)`);
}

console.log("done.");
