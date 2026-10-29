import { priceMarkup, subtotalMarkup, sizeMarkup, pricingNote, sizeReferenceNote, updateMarket } from "./market-ui";
import { choosingDialog, bindChoosing, localDate, eventMessage } from "./choosing";
import "./choosing.css";
import { readRegion, saveRegion, isRegion, regionSelector, deliverySummary, deliveryBreakdown } from "./delivery";
import { collectionParams, collectionUrl } from "./catalogue";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "./style.css";
import "./navigation.css";
import "./homepage.css";
import "./collection.css";
import "./product.css";
import "./hero.css";
import { bindCampaign } from "./hero";
import {homeDelivery, bindHomeDelivery, updateHomeDelivery} from './home-delivery';
import {blackFridayPage, bindBlackFriday, readBlackFridayFilters, blackFridayUrl} from './black-friday';
import './black-friday.css';
import storePolicy from "../data/store-policy.json";
import catalogue from "../data/products.json";
import imageManifest from "./image-manifest.json";
import colourImages from "./colour-manifest.json";
import {
  header,
  footer,
  studioPage,
  carePage,
  bindNavigation,
} from "./navigation";
import { collectionPage, bindCollection } from "./collection";
let region = readRegion();
const colourManifest: Record<string, Record<string, string>> = colourImages;

type Product = (typeof catalogue)[number];
const money = priceMarkup;
const escape = (s: string | null) =>
  (s ?? "Details not supplied").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const arrow =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const featured = ["VLM-008", "VLM-003", "VLM-019", "VLM-026"].map((id) =>
  catalogue.find((p) => p.id === id)!,
).filter(p => p.made_to_order || p.in_stock);
const art: Record<string, { src: string; colour: string }> = imageManifest;
const colourMap: Record<string, string> = {
  oxblood: "#6B1F2A",
  ivory: "#ede4d3",
  champagne: "#d4bc97",
  emerald: "#234b42",
  midnight: "#242c3a",
  pewter: "#8a8985",
  black: "#252422",
  "dusty rose": "#bc9194",
  sapphire: "#344b7d",
};
const describe = (p: Product, colour: string) => {
  const description = p.description;
  const original = p.colours.find((c) => description?.includes(`in ${c} `));
  return description && original
    ? description.replace(`in ${original} `, `in ${colour} `)
    : (description ?? `A ${p.fit} ${p.category} in ${colour} ${p.fabric}.`);
};
const initialColour = (p: Product) => {
  const requested = new URLSearchParams(location.search).get("colour");
  return requested && p.colours.includes(requested)
    ? requested
    : art[p.id].colour;
};
const shoppingContext = () => {
  const source = new URLSearchParams(location.search).get('collection');
  return collectionParams(source === null ? new URLSearchParams(location.search) : new URLSearchParams(source));
};
const campaignContext = () => location.pathname.endsWith('black-friday.html') || new URLSearchParams(location.search).get('campaign') === 'black-friday'
  ? readBlackFridayFilters(new URLSearchParams(location.search),catalogue) : null;
const href = (p: Product, colour?: string) => {
  const campaign=campaignContext();
  const params = campaign ? new URLSearchParams(blackFridayUrl(campaign,region).split('?')[1]) : shoppingContext();
  if(campaign) params.set('campaign','black-friday');
  params.set('region', region);
  const context = params.toString();
  params.set('collection', context);
  params.set('region', region); params.set('id', p.id);
  if (colour) params.set('colour', colour);
  else params.delete('colour');
  return `/product.html?${params}`;
};
const image = (p: Product, large = false, colour = art[p.id].colour) =>
  `<img src="/images/${colourManifest[p.id][colour]}" alt="${escape(p.name)}, ${escape(p.fabric)}, shown in ${escape(colour)}" ${large ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="1024" height="1536">`;
const card = (p: Product, colour?: string) =>
  `<article class="product-card"><a class="product-art" href="${href(p, colour)}">${image(p, false, colour)}<span class="view-piece">Discover the piece <span>${arrow}</span></span></a><div class="card-title"><a href="${href(p, colour)}" aria-label="${escape(p.name)}, ${escape(p.fabric)}, ${p.id}">${escape(p.name)} · ${escape(p.fabric)}</a><span>${money(p.price_gbp)}</span></div><p>${[
    p.fit ? `${p.fit} fit` : p.sizes.join(", "),
  ]
    .filter(Boolean)
    .map((x) => escape(x))
    .join(
      " · ",
    )}</p><p class="small">${p.made_to_order ? "Made to order" : p.in_stock ? "In stock" : "Currently unavailable"}</p><p class="small card-delivery" data-delivery-summary="${p.id}">${deliverySummary(p, region)}</p></article>`;
// Collection browsing keeps secondary facts in a native disclosure.
const collectionCard = (p: Product, colour?: string) => {
  const selectedColour = colour || art[p.id].colour;
  const availability = p.made_to_order ? "Made to order" : p.in_stock ? "In stock" : "Unavailable";
  return `<article class="product-card collection-product-card"><a class="product-art" href="${href(p, selectedColour)}">${image(p, false, selectedColour)}<span class="card-availability">${availability}</span></a><div class="collection-card-info"><a class="collection-card-name" href="${href(p, selectedColour)}" aria-label="${escape(p.name)}, ${escape(p.fabric)}, ${p.id}">${escape(p.name)}</a><span class="collection-card-price">${money(p.price_gbp)}</span><div class="card-swatches" role="group" aria-label="${escape(p.name)} colours">${p.colours.map(c => `<a class="card-swatch" href="${href(p, c)}" style="--swatch:${colourMap[c]}" aria-label="View ${escape(p.name)} in ${escape(c)}" ${c === selectedColour ? 'aria-current="true"' : ''}><span aria-hidden="true"></span></a>`).join("")}</div><details class="card-facts"><summary>Fabric, fit & delivery</summary><div><p>${escape(p.fabric)}${p.fit ? ` · ${escape(p.fit)} fit` : ` · ${escape(p.sizes.join(", "))}`}</p><p class="card-delivery" data-delivery-summary="${p.id}">${deliverySummary(p, region)}</p>${p.in_stock ? `<p data-delivery-breakdown="${p.id}">${deliveryBreakdown(p, region)}</p>` : ""}</div></details></div></article>`;
};
const makingDays = catalogue
  .filter((p) => p.made_to_order)
  .map((p) => p.lead_time_days);
const makingRange = `${Math.min(...makingDays)}–${Math.max(...makingDays)}`;
const ukDelivery = `${storePolicy.deliveryDays.UK.min}–${storePolicy.deliveryDays.UK.max}`;
const euDelivery = `${storePolicy.deliveryDays.EU.min}–${storePolicy.deliveryDays.EU.max}`;
const occasionEdits = [
  {label:'Winter weddings',occasion:'winter wedding',id:'VLM-003',colour:'emerald'},
  {label:'Black tie',occasion:'black tie',id:'VLM-002',colour:'midnight'},
  {label:'New Year’s Eve',occasion:"new year's eve",id:'VLM-010',colour:'midnight'},
];
function occasionDiscovery() {
  return `<section class="occasion-discovery" id="occasions" aria-labelledby="occasion-heading"><div class="occasion-discovery-heading"><h2 id="occasion-heading">Shop by <em>occasion.</em></h2><a class="stock-shortcut" href="${collectionUrl({stock:'in-stock',sort:'soonest'})}">Shop in-stock pieces ${arrow}</a></div><div class="occasion-edits">${occasionEdits.map(edit=>{const piece=catalogue.find(p=>p.id===edit.id)!;return `<a class="occasion-edit" aria-label="${edit.label}" href="${collectionUrl({occasion:edit.occasion})}"><span class="occasion-edit-image">${image(piece,false,edit.colour)}</span><span class="occasion-edit-label">${edit.label} ${arrow}</span></a>`;}).join('')}</div></section>`;
}
const home = `<main id="main" tabindex="-1" class="homepage">
<section class="campaign-hero" aria-labelledby="campaign-heading">
  <picture class="campaign-picture"><source media="(max-width: 760px)" srcset="/images/hero-mobile.webp" width="1024" height="1536"><img src="/images/hero.webp" alt="A woman in an oxblood evening dress in a stone gallery" fetchpriority="high" width="1536" height="1024"></picture>
  <div class="campaign-content"><h1 id="campaign-heading">Dressed for<br><em>the night.</em></h1><p class="campaign-description">London eveningwear for winter weddings, black-tie dinners and New Year’s Eve.</p><div class="campaign-actions"><a class="campaign-shop" href="/collection.html">Shop the collection ${arrow}</a><button type="button" class="campaign-adviser" data-choose>Help me choose</button></div></div>
</section>
${occasionDiscovery()}
${homeDelivery(region)}
<section class="collection section" id="collection"><div class="section-heading"><h2>Pieces for the <em>evening.</em></h2><a href="/collection.html" class="text-link">View all ${catalogue.length} pieces ${arrow}</a></div><div class="product-grid" id="product-grid">${featured.map((p) => card(p)).join("")}</div></section>
<section class="studio making-story" id="studio"><div class="studio-art"><img src="/images/crepe-detail.webp" alt="Soft folds of oxblood crepe against ivory stone" loading="lazy" width="1024" height="1536"></div><div class="studio-copy"><h2>Made for you.<br><em>Allow a little time.</em></h2><p>Most pieces are made to order in our London studio. Making and delivery are separate, so leave room for both before your occasion.</p><dl class="making-details"><div><dt>Time to make</dt><dd>${makingRange} days. Check your chosen piece for its making time.</dd></div><div><dt>Then, delivery</dt><dd>${ukDelivery} days within the UK; ${euDelivery} days to the EU. These are estimates.</dd></div><div><dt>Looking for something sooner?</dt><dd>Selected pieces are in stock. Each product page shows the time before shipping.</dd></div></dl><a class="text-link" href="/client-care.html#making">Making, delivery & returns ${arrow}</a></div></section>
<section class="closing"><h2>Find the piece.<br><em>Plan the evening.</em></h2><a class="text-link" href="/collection.html">Explore all ${catalogue.length} pieces ${arrow}</a></section></main>`;
function productPage(p: Product) {
  document.title = `${p.name} | ${p.fabric} | Velmora`;
  const available = p.made_to_order || p.in_stock;
  const selectedColour = initialColour(p);
  const selectedSize = new URLSearchParams(location.search).get("size");
  const returns = `Returns within ${storePolicy.returns.days} days, ${storePolicy.returns.condition}. Made-to-order pieces in a non-standard size cannot be returned.`;
  const sizeControls = p.sizes.length === 1
    ? `<div class="product-single-size"><span>Size</span><strong>${sizeMarkup(p.sizes[0])}</strong><input type="hidden" name="size" value="${escape(p.sizes[0])}"></div>`
    : `<fieldset class="product-sizes"><legend>Size <button type="button" class="text-link size-guide">Fit information</button></legend><div class="sizes">${p.sizes.map((size) => `<label><input type="radio" name="size" value="${escape(size)}" ${selectedSize === size ? "checked" : ""} required>${sizeMarkup(size)}</label>`).join("")}</div></fieldset>`;
  const measurementNote = p.category === "accessory"
    ? "Dimensions are not currently available."
    : "Garment measurements are not currently available. A size label alone cannot confirm fit.";
  return `<main id="main" tabindex="-1" class="product-page">
    <div class="breadcrumb"><a href="${campaignContext()?blackFridayUrl(campaignContext()!,region)+'#in-stock':collectionUrl({}, shoppingContext())}">${campaignContext()?'Back to Black Friday edit':'Back to collection'}</a><span aria-hidden="true">/</span><span>${escape(p.name)}</span></div>
    <section class="product-layout ${p.category === "accessory" ? "product-layout--accessory" : ""}" aria-labelledby="product-name">
      <div class="product-heading"><div class="product-title"><h1 id="product-name">${escape(p.name)}</h1><span>${money(p.price_gbp)}</span></div><p class="product-subtitle">${escape(p.fabric)} · ${p.fit ? `${escape(p.fit)} fit` : escape(p.sizes.join(", "))}</p></div>
      <div class="product-media"><div class="product-hero">${image(p, true, selectedColour)}</div><p class="image-note" id="product-image-note">${art[p.id] ? `Shown in ${escape(selectedColour)}` : "Product image not available."}</p></div>
      <div class="product-info">
        <p class="description" id="product-description">${escape(describe(p, selectedColour))}</p>
        <button type="button" class="product-adviser text-link" data-choose>Ask about this piece</button>
        <form id="product-form">
          <fieldset class="product-colours"><legend>Colour <span id="colour-name">${escape(selectedColour)}</span></legend><div class="colours">${p.colours.map((colour) => `<label class="colour-option"><input type="radio" name="colour" value="${escape(colour)}" ${colour === selectedColour ? "checked" : ""} required><span style="--colour:${colourMap[colour] || "#777"}"></span><span>${escape(colour)}</span></label>`).join("")}</div></fieldset>
          ${sizeControls}${p.category !== "accessory" ? sizeReferenceNote() : ""}
          <p class="product-fit-note">${measurementNote}</p>${pricingNote()}
          <section class="product-delivery" aria-label="Availability and delivery">
            <div class="product-delivery-controls"><span class="product-availability">${p.made_to_order ? "Made to order" : p.in_stock ? "In stock" : "Currently unavailable"}</span>${regionSelector(region)}</div>
            ${available ? `<div class="product-estimate" aria-live="polite" aria-atomic="true"><strong data-delivery-summary="${p.id}">${deliverySummary(p, region)}</strong><p data-delivery-breakdown="${p.id}">${deliveryBreakdown(p, region)}</p><small>Timeframes are estimates.</small></div>` : ""}
          </section>
          <button class="primary" ${available ? "" : "disabled"}>${available ? "Add to bag" : "Unavailable"}<span>${arrow}</span></button>
          <p class="purchase-returns">${returns}</p>
          <p id="added-message" role="status" class="small"></p>
        </form>
        ${available ? `<details class="event-planner product-date-check"><summary>Compare with your event date</summary><div class="product-date-content"><label class="event-date-label" for="event-date">Your event date<input id="event-date" type="date" min="${localDate()}" aria-describedby="event-guidance"></label><p id="event-guidance" role="status">Choose a date to compare how much time you have. Arrival dates are not guaranteed.</p></div></details>` : ""}
        <details id="fit-info"><summary>Fabric & fit</summary><p>${escape(p.fabric)}. ${p.fit ? `${escape(p.fit)} fit. ` : ""}${p.sizes.length === 1 ? `Available in ${sizeMarkup(p.sizes[0])}.` : `Available in ${sizeMarkup(p.sizes[0])} to ${sizeMarkup(p.sizes.at(-1)!)}.`}</p><p>${measurementNote}${p.category !== "accessory" ? ' <a class="inline-link" href="/client-care.html#sizing">Read our fit guide</a>.' : ""}</p></details>
        <details><summary>Delivery & returns</summary>${available ? `<p data-delivery-breakdown="${p.id}">${deliveryBreakdown(p, region)}</p><p>Timeframes are estimates. Please allow for preparation and delivery.</p>` : '<p>This piece is currently unavailable. No delivery estimate is available.</p>'}<p>${returns}</p></details>
        <p class="sku">${p.id}</p>
      </div>
    </section>
    <section class="section"><div class="section-heading"><div><h2>For another <em>evening.</em></h2></div><a class="text-link" href="/collection.html">The collection ${arrow}</a></div><div class="product-grid">${featured.filter((piece) => piece.id !== p.id).map((piece) => card(piece)).join("")}</div></section>
  </main>`;
}
const id = new URLSearchParams(location.search).get("id");
const isProduct = location.pathname.endsWith("product.html");
const isCollection = location.pathname.endsWith("collection.html");
const isStudio = location.pathname.endsWith("studio.html");
const isCare = location.pathname.endsWith("client-care.html");
const isBlackFriday = location.pathname.endsWith("black-friday.html");
const product = catalogue.find((p) => p.id === (id || "VLM-008"));
if (isCollection) document.title = "The collection | Velmora";
if (isStudio) document.title = "Our studio | Velmora";
if (isCare) document.title = "Client care | Velmora";
document.querySelector("#app")!.innerHTML =
  header +
  (isProduct
    ? product
      ? productPage(product)
      : '<main id="main" tabindex="-1" class="section"><h1>Piece not found.</h1><a href="/collection.html">Return to the collection</a></main>'
    : isCollection
      ? collectionPage(collectionCard)
      : isStudio
        ? studioPage
        : isCare
          ? carePage
          : isBlackFriday
            ? blackFridayPage({products:catalogue,region,filters:readBlackFridayFilters(new URLSearchParams(location.search),catalogue),card,delivery:()=>homeDelivery(region),link:collectionUrl,arrow})
            : home) +
  footer + choosingDialog;
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
bindNavigation();
if (isCollection) bindCollection();
bindChoosing(isProduct ? product : undefined);
bindCampaign();
bindHomeDelivery();
const updateBlackFriday=isBlackFriday ? bindBlackFriday({products:catalogue,card,delivery:()=>homeDelivery(region),link:collectionUrl,arrow,market:selected=>{void updateMarket(selected);}}) : null;
const eventDate = document.querySelector<HTMLInputElement>("#event-date");
if (eventDate) eventDate.onchange = () => { document.querySelector("#event-guidance")!.textContent = eventMessage(eventDate.value); };
document
  .querySelectorAll<HTMLButtonElement>("[data-close]")
  .forEach((b) => (b.onclick = () => b.closest("dialog")!.close()));
type BagItem = { id: string; size: string; colour: string };
function readBag(): BagItem[] {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem("velmora-bag") || "[]",
    );
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (i): i is BagItem =>
        !!i &&
        typeof i === "object" &&
        catalogue.some(
          (p) =>
            p.id === i.id &&
            p.sizes.includes(i.size) &&
            p.colours.includes(i.colour),
        ),
    );
  } catch {
    return [];
  }
}
const bag: BagItem[] = readBag();
function renderBag() {
  try {
    sessionStorage.setItem("velmora-bag", JSON.stringify(bag));
  } catch {
    /* The bag still works for this page when browser storage is disabled. */
  }
  $("#bag-count").textContent = String(bag.length);
  $("#bag-items").innerHTML = bag.length
    ? bag
        .map((i, index) => {
          const p = catalogue.find((p) => p.id === i.id)!;
          return `<div class="bag-item"><a class="bag-photo" href="${href(p, i.colour)}" tabindex="-1" aria-hidden="true"><img src="/images/${colourManifest[p.id][i.colour]}" alt="" width="80" height="120"></a><div><a href="${href(p, i.colour)}" aria-label="${escape(p.name)}, ${escape(p.fabric)}, ${p.id}">${escape(p.name)}</a><p>${escape(i.colour)} · ${sizeMarkup(i.size)}</p><span>${money(p.price_gbp)}</span><p class="bag-delivery" data-delivery-summary="${p.id}">${deliverySummary(p, region)}</p>${p.in_stock ? `<p class="bag-delivery" data-delivery-breakdown="${p.id}">${deliveryBreakdown(p, region)}</p>` : ""}</div><button data-remove="${index}" aria-label="Remove ${escape(p.name)}">Remove</button></div>`;
        })
        .join("") +
      `<p class="small">Delivery estimates apply to each piece. A shared dispatch date is not confirmed.</p><p class="bag-total">Subtotal <span>${subtotalMarkup(bag.map(i => catalogue.find(p => p.id === i.id)!.price_gbp))}</span></p>${pricingNote()}`
    : '<p>Your bag is empty.</p><a class="text-link" href="/collection.html">Explore the collection</a>';
  document.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        bag.splice(Number(b.dataset.remove), 1);
        renderBag();
        const next =
          document.querySelector<HTMLElement>("[data-remove]") ||
          $("#bag-dialog [data-close]");
        next.focus();
      }),
  );
  void updateMarket(region);
}
renderBag();
$("#bag-open").onclick = () => {
  renderBag();
  $<HTMLDialogElement>("#bag-dialog").showModal();
};
if (isProduct && product) {
  document.querySelectorAll<HTMLInputElement>("input[name=colour]").forEach(
    (i) =>
      (i.onclick = () => {
        $("#colour-name").textContent = i.value;
        $("#product-description").textContent = describe(product, i.value);
        const image = $<HTMLImageElement>(".product-hero img");
        const note = $("#product-image-note");
        const filename = colourManifest[product.id]?.[i.value];
        if (!filename) {
          note.textContent = "This colour image is still being prepared.";
          return;
        }
        image.setAttribute("aria-busy", "true");
        note.textContent = `Loading the ${i.value} view…`;
        image.onload = () => {
          image.removeAttribute("aria-busy");
          note.textContent = `Shown in ${i.value}`;
        };
        image.onerror = () => {
          image.removeAttribute("aria-busy");
          note.textContent =
            "This image could not load. Please select the colour again to retry.";
        };
        image.alt = `${product.name}, ${product.fabric}, shown in ${i.value}`;
        image.src = `/images/${filename}`;
      }),
  );
  $<HTMLFormElement>("#product-form").onsubmit = (e) => {
    e.preventDefault();
    if (!product.made_to_order && !product.in_stock) return;
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const size = String(data.get("size"));
    const colour = String(data.get("colour"));
    if (!product.sizes.includes(size) || !product.colours.includes(colour)) return;
    bag.push({ id: product.id, size, colour });
    renderBag();
    $("#added-message").textContent = `${product.name} added to your bag.`;
    $<HTMLDialogElement>("#bag-dialog").showModal();
  };
  const sizeGuide = document.querySelector<HTMLButtonElement>(".size-guide");
  if (sizeGuide) sizeGuide.onclick = () => {
    $<HTMLDetailsElement>("#fit-info").open = true;
    $("#fit-info").scrollIntoView({ block: "center" });
    $("#fit-info summary").focus({ preventScroll: true });
  };
}

document.querySelectorAll<HTMLSelectElement>('#delivery-region, [data-market-region]').forEach(regionControl => {
regionControl.onchange = () => {
  if (!isRegion(regionControl.value)) return;
  region = regionControl.value;
  saveRegion(region);
  updateHomeDelivery(region);
  const params = new URLSearchParams(location.search);
  params.set('region', region);
  if (isCollection) { location.assign(`/collection.html?${params}`); return; }
  history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
  updateBlackFriday?.(region);
  document.querySelectorAll<HTMLElement>('[data-delivery-summary]').forEach(el => {
    const piece = catalogue.find(p => p.id === el.dataset.deliverySummary);
    if (piece) el.textContent = deliverySummary(piece, region);
  });
  document.querySelectorAll<HTMLElement>('[data-delivery-breakdown]').forEach(el => {
    const piece = catalogue.find(p => p.id === el.dataset.deliveryBreakdown);
    if (piece) el.textContent = deliveryBreakdown(piece, region);
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const url = new URL(link.href);
    if (url.origin === location.origin && (url.pathname.endsWith('collection.html') || url.pathname.endsWith('product.html'))) {
      url.searchParams.set('region', region); link.href = url.pathname + url.search + url.hash;
    }
  });
  renderBag();
  void updateMarket(region);
};
});
void updateMarket(region);
