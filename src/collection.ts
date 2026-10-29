import { sizeLabel } from "./market";
import { pricingNote, sizeReferenceNote } from "./market-ui";
import { readRegion, regionSelector, estimateDelivery, catalogueDeliveryWindow, formatDeliverySummary, formatDeliveryBreakdown } from "./delivery";
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
  const deliveryGuidance = (label: string, madeToOrder: boolean) => {
    const estimate = catalogueDeliveryWindow(catalogue, region, madeToOrder);
    return estimate ? `<p><strong>${label}</strong><br>${formatDeliverySummary(estimate.total, region)}. ${formatDeliveryBreakdown(estimate.preparation, estimate.shipping, madeToOrder)}</p>` : "";
  };
  return `<main id="main" tabindex="-1" class="collection-page section"><div class="page-heading"><h1>${escape(heading)}</h1>${q ? `<p>Pieces matching “${escape(q)}”.</p>` : ""}</div>
 <nav class="category-links" aria-label="Product categories"><a href="${escape(collectionUrl({ category: null }, params))}" ${!category ? 'aria-current="page"' : ""}>View all</a>${Object.entries(
   categories,
 )
   .map(
     ([key, label]) =>
       `<a href="${escape(collectionUrl({ category: key }, params))}" ${key === category ? 'aria-current="page"' : ""}>${label}</a>`,
   )
   .join("")}</nav>
 <div class="collection-context">${regionSelector(region, true)}<details class="collection-guidance"><summary>Delivery & fit</summary><div class="collection-guidance-body">${deliveryGuidance("Made to order", true)}${deliveryGuidance("In-stock pieces", false)}<p>Check your chosen piece for its estimate. Arrival dates are not guaranteed.</p>${pricingNote()}<a href="/client-care.html#delivery">Delivery, fit & returns guidance</a></div></details></div>
 <div class="collection-toolbar"><p class="collection-count" role="status">${items.length} ${items.length === 1 ? "piece" : "pieces"}</p><button type="button" id="collection-filter-open" aria-haspopup="dialog" aria-controls="collection-filter-dialog" aria-expanded="false">Filter & sort${active.length ? ` <span>(${active.length})</span>` : ""}<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--ivory)"/><circle cx="15" cy="12" r="2" fill="var(--ivory)"/><circle cx="10" cy="18" r="2" fill="var(--ivory)"/></svg></button></div>
 <dialog id="collection-filter-dialog" aria-labelledby="collection-filter-title"><div class="collection-filter-head"><h2 id="collection-filter-title" tabindex="-1">Filter & sort</h2><button type="button" id="collection-filter-close" aria-label="Close filters">Close <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="m5 5 14 14M5 19 19 5"/></svg></button></div><form class="collection-filters" action="/collection.html" method="get" aria-label="Filter the collection">${hidden("region", region)}${hidden("category", category)}<div class="collection-filter-fields"><div class="collection-search"><label for="collection-search">Search by name, fabric or occasion</label><input type="search" id="collection-search" name="q" value="${escape(q)}" placeholder="Try velvet or winter wedding"></div><label class="collection-sort">Sort<select name="sort" id="collection-sort"><option value="">Collection order</option><option value="low" ${sort === "low" ? "selected" : ""}>Price: low to high</option><option value="soonest" ${sort === "soonest" ? "selected" : ""}>Soonest estimated delivery</option><option value="high" ${sort === "high" ? "selected" : ""}>Price: high to low</option></select></label><div class="filter-controls">${select("occasion", "Occasions", occasions, occasion)}${select("colour", "Colours", [...new Set(catalogue.flatMap((p) => p.colours))], colour)}${select("size", "Sizes", [...new Set(catalogue.flatMap((p) => p.sizes))], size)}${select("fabric", "Fabric", [...new Set(catalogue.map(p => p.fabric))], fabric)}${select("fit", "Fit", [...new Set(catalogue.flatMap(p => p.fit ? [p.fit] : []))], fit)}<label>Availability<select name="stock"><option value="">All pieces</option><option value="in-stock" ${stock ? "selected" : ""}>In stock</option></select></label></div>${sizeReferenceNote()}<a class="stock-shortcut" href="${escape(collectionUrl({stock:'in-stock',sort:'soonest'},params))}">Shop in-stock pieces</a></div><div class="collection-filter-footer"><a class="clear-filters" href="${clearUrl}">Clear all</a><button class="apply-filters" type="submit">Show results</button></div></form></dialog>
 ${active.length ? `<div class="active-filters" aria-label="Selected filters">${active.map(([key, label]) => `<a class="filter-chip" href="${escape(collectionUrl({ [key]: null }, params))}" aria-label="Remove ${escape(label)}">${escape(label)} ${removeIcon}</a>`).join("")}<a class="clear-filters" href="${clearUrl}">Clear all</a></div>` : ""}
 ${items.length ? `<div class="product-grid">${items.map((p) => card(p, colour || undefined)).join("")}</div>` : `<div class="empty-results"><h2>A different direction.</h2><p>No pieces match this combination. Remove a selected filter above, or explore the full collection.</p><a class="text-link" href="${clearUrl}">Explore all pieces</a></div>`}</main>`;
}
export function bindCollection() {
  const dialog = document.querySelector<HTMLDialogElement>("#collection-filter-dialog");
  const opener = document.querySelector<HTMLButtonElement>("#collection-filter-open");
  const closer = document.querySelector<HTMLButtonElement>("#collection-filter-close");
  if (!dialog || !opener || !closer) return;
  opener.onclick = () => {
    dialog.showModal();
    opener.setAttribute("aria-expanded", "true");
    document.querySelector<HTMLElement>("#collection-filter-title")!.focus();
  };
  closer.onclick = () => dialog.close();
  dialog.addEventListener("close", () => opener.setAttribute("aria-expanded", "false"));
}
