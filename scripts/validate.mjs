import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function pngSize(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("not a PNG file");
  }
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function icoSizes(buffer) {
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    throw new Error("not an ICO file");
  }
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return [buffer[offset] || 256, buffer[offset + 1] || 256];
  });
}

const checksumText = await readFile(resolve(root, "checksums.sha256"), "utf8");
const checksumRows = checksumText.trim().split("\n").map((line) => {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/);
  if (!match) throw new Error(`invalid checksum row: ${line}`);
  return { expected: match[1], path: match[2] };
});

for (const row of checksumRows) {
  const data = await readFile(resolve(root, row.path));
  const actual = createHash("sha256").update(data).digest("hex");
  if (actual !== row.expected) throw new Error(`checksum mismatch: ${row.path}`);
}

const brand = JSON.parse(await readFile(resolve(root, "brand.json"), "utf8"));
for (const path of Object.values(brand.assets)) {
  await readFile(resolve(root, path));
}

if (brand.schemaVersion !== 1 || typeof brand.assetVersion !== "string") {
  throw new Error("invalid root brand manifest");
}

const hexColor = /^#[0-9A-F]{6}$/;
for (const [productId, manifestPath] of Object.entries(brand.products ?? {})) {
  const absoluteManifestPath = resolve(root, manifestPath);
  const productRoot = dirname(absoluteManifestPath);
  const product = JSON.parse(await readFile(absoluteManifestPath, "utf8"));
  if (product.schemaVersion !== 1 || product.product?.slug !== productId ||
      typeof product.brandVersion !== "string") {
    throw new Error(`invalid product brand manifest: ${productId}`);
  }
  for (const [name, color] of Object.entries(product.visual?.colors ?? {})) {
    if (typeof color !== "string" || !hexColor.test(color)) {
      throw new Error(`invalid ${productId} color ${name}: ${color}`);
    }
  }
  for (const path of Object.values(product.assets ?? {})) {
    await readFile(resolve(productRoot, path));
  }
  await readFile(resolve(productRoot, product.terminology));
  await readFile(resolve(productRoot, "tokens.css"));
}

const expectedPngSizes = new Map([
  ["assets/logo/cinagroup-logo.png", [256, 256]],
  ["assets/logo/cinagroup-logo-rounded-3px.png", [256, 256]],
  ["assets/logo/cinagroup-mark-black.png", [256, 256]],
  ["assets/logo/cinagroup-mark-white.png", [256, 256]],
  ["assets/icons/web/favicon-16.png", [16, 16]],
  ["assets/icons/web/favicon-32.png", [32, 32]],
  ["assets/icons/web/apple-touch-icon.png", [180, 180]],
  ["assets/icons/web/pwa-192.png", [192, 192]],
  ["assets/icons/web/pwa-512.png", [512, 512]],
  ["assets/icons/app/cinagroup-app-icon-1024.png", [1024, 1024]],
]);

for (const [path, expected] of expectedPngSizes) {
  const actual = pngSize(await readFile(resolve(root, path)));
  if (actual[0] !== expected[0] || actual[1] !== expected[1]) {
    throw new Error(`unexpected PNG size for ${path}: ${actual.join("x")}`);
  }
}

const expectedIcoSizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
for (const path of ["assets/icons/web/favicon.ico", "assets/icons/windows/cinagroup.ico"]) {
  const sizes = icoSizes(await readFile(resolve(root, path))).map(([width]) => width);
  if (JSON.stringify(sizes) !== JSON.stringify(expectedIcoSizes)) {
    throw new Error(`unexpected ICO sizes for ${path}: ${sizes.join(", ")}`);
  }
}

console.log(
  `Validated ${checksumRows.length} CinaGroup brand assets and ${Object.keys(brand.products ?? {}).length} product manifest.`,
);
