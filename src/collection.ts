import { sizeLabel } from "./market";
import { pricingNote, sizeReferenceNote } from "./market-ui";
import { readRegion, regionSelector, estimateDelivery } from "./delivery";
import {
  catalogue,
  categories,
  occasions,
  escape,
  titleCase,
  collectionUrl,
  collectionParams,
  type Product,
} from "./catalogue";
import policy from "../data/store-policy.json";

export function collectionPage(card: (p: Product, colour?: string) => string) {
  const params = collectionParams();
  const region = readRegion();
  params.set("region", region);
  const category = params.get("category") || "";
  const occasion = params.get("occasion") || "";
  const colour = params.get("colour") || "";
  const fabric = params.get("fabric") || "";
  const fit = params.get("fit") || "";
  const size = params.get("size") || "";
  const q = (params.get("q") || "").trim();
  const sort = params.get("sort") || "";
  const stock = params.get("stock") === "in-stock";
  const terms = q.toLocaleLowerCase("en-GB").split(/\s+/).filter(Boolean);
  const items = catalogue.filter(
    (p) =>
      (!category || p.category === category) &&
      (!fabric || p.fabric === fabric) &&
      (!fit || p.fit === fit) &&
      (!occasion || p.occasions.includes(occasion)) &&
      (!colour || p.colours.includes(colour)) &&
      (!size || p.sizes.includes(size)) &&
      (!stock || p.in_stock) &&
      terms.every((t) =>
        [
          p.name,
          p.id,
          p.category,
          categories[p.category],
          p.fabric,
          p.fit,
          ...p.colours,
          ...p.occasions,
        ]
          .join(" ")
          .toLocaleLowerCase("en-GB")
          .includes(t),
      ),
  );
  if (sort === "low" || sort === "high")
    items.sort((a, b) =>
      sort === "low" ? a.price_gbp - b.price_gbp : b.price_gbp - a.price_gbp,
    );
  if (sort === "soonest") items.sort((a,b) => (estimateDelivery(a,region)?.total.max ?? Infinity) - (estimateDelivery(b,region)?.total.max ?? Infinity));
  const clearUrl = collectionUrl({}, new URLSearchParams({region}));
  const occasionHeading = occasion ? titleCase(occasion) : "";
  const heading = q
    ? "Search results"
    : category && occasion
      ? `${occasionHeading} ${categories[category].toLowerCase()}`
      : categories[category] || occasionHeading || "The collection";
  const options = (values: string[], selected: string, keyForOptions: string) =>
    values
      .map(
        (v) =>
          `<option value="${escape(v)}" ${v === selected ? "selected" : ""}>${escape(keyForOptions === "size" ? sizeLabel(v, region) : titleCase(v))}</option>`,
      )
      .join("");
  const select = (
    key: string,
    label: string,
    values: string[],
    selected: string,
  ) =>
    `<label>${label}<select name="${key}"><option value="">All ${label.toLowerCase()}</option>${options(values, selected, key)}</select></label>`;
  const hidden = (key: string, value: string) =>
    value
      ? `<input type="hidden" name="${escape(key)}" value="${escape(value)}">`
      : "";
  const criteria: [string, string][] = [
    ["category", categories[category] || category],
    ["occasion", occasion && titleCase(occasion)],
    ["colour", colour && titleCase(colour)],
    ["size", sizeLabel(size, region)],
    ["fabric", fabric && titleCase(fabric)],
    ["fit", fit && titleCase(fit)],
    ["q", q && `Search: ${q}`],
    ["stock", stock ? "In stock" : ""],
    [
      "sort",
      sort === "low"
        ? "Price: low to high"
        : sort === "high"
          ? "Price: high to low"
          : sort === "soonest" ? "Soonest estimated delivery" : "",
    ],
  ];
  const active = criteria.filter(([, v]) => v);
  const removeIcon =
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 4 8 8M4 12l8-8"/></svg>';
  const days = catalogue
    .filter((p) => p.made_to_order)
    .map((p) => p.lead_time_days);
  const shipping = policy.deliveryDays[region];
  return `<main id="main" tabindex="-1" class="collection-page section"><div class="page-heading"><h1>${escape(heading)}</h1>${q ? `<p>Pieces matching “${escape(q)}”.</p>` : ""}</div>
 <nav class="category-links" aria-label="Product categories"><a href="${escape(collectionUrl({ category: null }, params))}" ${!category ? 'aria-current="page"' : ""}>View all</a>${Object.entries(
   categories,
 )
   .map(
     ([key, label]) =>
       `<a href="${escape(collectionUrl({ category: key }, params))}" ${key === category ? 'aria-current="page"' : ""}>${label}</a>`,
   )
   .join("")}</nav>
 <div class="collection-arrival"><p>Made to order: ${Math.min(...days)}–${Math.max(...days)} days to make, then ${shipping.min}–${shipping.max} days for ${region} delivery. Estimates vary by piece.</p>${regionSelector(region)}<button type="button" class="text-link" data-choose>Help me choose</button><a href="/client-care.html#delivery">Delivery & fit guidance</a></div>
 ${pricingNote()}<div class="collection-toolbar"><div class="collection-summary"><p class="collection-count" role="status">${items.length} ${items.length === 1 ? "piece" : "pieces"}</p><a class="stock-shortcut" href="${escape(collectionUrl({stock:'in-stock',sort:'soonest'},params))}">Shop in-stock pieces</a></div><details class="filter-disclosure"><summary>Filter & search${active.length ? ` <span>(${active.length})</span>` : ""}</summary><form class="collection-filters" action="/collection.html" method="get" aria-label="Filter the collection">${hidden("region", region)}${hidden("category", category)}${hidden("sort", sort)}<div class="collection-search"><label for="collection-search">Search by name, fabric or occasion</label><input type="search" id="collection-search" name="q" value="${escape(q)}" placeholder="Try velvet or winter wedding"></div><div class="filter-controls">${select("occasion", "Occasions", occasions, occasion)}${select("colour", "Colours", [...new Set(catalogue.flatMap((p) => p.colours))], colour)}${select("size", "Sizes", [...new Set(catalogue.flatMap((p) => p.sizes))], size)}${select("fabric", "Fabric", [...new Set(catalogue.map(p => p.fabric))], fabric)}${select("fit", "Fit", [...new Set(catalogue.flatMap(p => p.fit ? [p.fit] : []))], fit)}<label>Availability<select name="stock"><option value="">All pieces</option><option value="in-stock" ${stock ? "selected" : ""}>In stock</option></select></label></div>${sizeReferenceNote()}<button class="apply-filters" type="submit">Show results</button></form></details><form class="collection-sort" action="/collection.html" method="get" aria-label="Sort the collection">${[
   ...params.entries(),
 ]
   .filter(([k, v]) => k !== "sort" && v)
   .map(([k, v]) => hidden(k, v))
   .join(
     "",
   )}<label>Sort<select name="sort" id="collection-sort"><option value="">Collection order</option><option value="low" ${sort === "low" ? "selected" : ""}>Price: low to high</option><option value="soonest" ${sort === "soonest" ? "selected" : ""}>Soonest estimated delivery</option><option value="high" ${sort === "high" ? "selected" : ""}>Price: high to low</option></select></label></form></div>
 ${active.length ? `<div class="active-filters" aria-label="Selected filters">${active.map(([key, label]) => `<a class="filter-chip" href="${escape(collectionUrl({ [key]: null }, params))}" aria-label="Remove ${escape(label)}">${escape(label)} ${removeIcon}</a>`).join("")}<a class="clear-filters" href="${clearUrl}">Clear all</a></div>` : ""}
 ${items.length ? `<div class="product-grid">${items.map((p) => card(p, colour || undefined)).join("")}</div>` : `<div class="empty-results"><h2>A different direction.</h2><p>No pieces match this combination. Remove a selected filter above, or explore the full collection.</p><a class="text-link" href="${clearUrl}">Explore all pieces</a></div>`}</main>`;
}
export function bindCollection() {
  const sort = document.querySelector<HTMLSelectElement>("#collection-sort");
  if (sort) sort.onchange = () => sort.form!.requestSubmit();
  const filters =
    document.querySelector<HTMLDetailsElement>(".filter-disclosure");
  if (filters) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && filters.open) {
        filters.open = false;
        filters.querySelector<HTMLElement>("summary")!.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (e.target instanceof Node && !filters.contains(e.target))
        filters.open = false;
    });
  }
}
