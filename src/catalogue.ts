import { readRegion } from "./delivery";
import catalogue from "../data/products.json";
export { catalogue };
export type Product = (typeof catalogue)[number];
export const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const categories: Record<string, string> = {
  dress: "Dresses",
  jumpsuit: "Jumpsuits",
  top: "Tops",
  skirt: "Skirts",
  outerwear: "Outerwear",
  accessory: "Accessories",
};
export const occasions = [...new Set(catalogue.flatMap((p) => p.occasions))];
export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function collectionUrl(
  updates: Record<string, string | null>,
  base = new URLSearchParams(),
) {
  const params = collectionParams(base);
  params.set("region", readRegion());
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  for (const [key, value] of [...params]) if (!value) params.delete(key);
  return `/collection.html${params.size ? `?${params}` : ""}`;
}
export function collectionLink(key: string, value: string) {
  const base = location.pathname.endsWith("collection.html")
    ? new URLSearchParams(location.search)
    : new URLSearchParams();
  return collectionUrl({ [key]: value }, base);
}

/** Only catalogue-supported query values cross shopping routes. */
export function collectionParams(input = new URLSearchParams(location.search)) {
  const params = new URLSearchParams();
  const allowed: Record<string, (string | null)[]> = {
    category: Object.keys(categories), occasion: occasions,
    colour: catalogue.flatMap(p => p.colours), size: catalogue.flatMap(p => p.sizes),
    fabric: catalogue.map(p => p.fabric), fit: catalogue.map(p => p.fit).filter(Boolean),
    stock: ['in-stock'], sort: ['low', 'high', 'soonest'], region: ['UK', 'EU'],
  };
  for (const [key, values] of Object.entries(allowed)) {
    const value = input.get(key); if (value && values.includes(value)) params.set(key, value);
  }
  const q = input.get('q')?.trim(); if (q) params.set('q', q);
  return params;
}
