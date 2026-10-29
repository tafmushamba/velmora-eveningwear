import { readFile, writeFile, access } from "node:fs/promises";
const products = JSON.parse(
  await readFile(new URL("../data/products.json", import.meta.url), "utf8"),
);
const existing = {
  "VLM-008": { src: "vela", colour: "oxblood" },
  "VLM-003": { src: "isola", colour: "champagne" },
  "VLM-019": { src: "livia", colour: "midnight" },
};
const reviewedColours = {"VLM-005":"oxblood","VLM-020":"oxblood","VLM-025":"oxblood","VLM-028":"ivory","VLM-031":"ivory","VLM-033":"oxblood","VLM-044":"oxblood"};
const manifest = {};
for (const p of products) {
  const image = existing[p.id] ?? { src: p.id, colour: reviewedColours[p.id] ?? p.colours[0] };
  await access(new URL(`../public/images/${image.src}.webp`, import.meta.url));
  manifest[p.id] = image;
}
for (const name of ["hero", "hero-mobile", "crepe-detail"]) {
  await access(new URL(`../public/images/${name}.webp`, import.meta.url));
}
await writeFile(
  new URL("../src/image-manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Verified primary images for all ${products.length} catalogue products and all campaign/detail images.`,
);
