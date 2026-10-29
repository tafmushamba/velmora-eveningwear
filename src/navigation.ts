import { marketSelector, pricingNote } from "./market-ui";
import { navigationState } from "./navigation-state";
import storePolicy from "../data/store-policy.json";
import {
  catalogue,
  categories,
  occasions,
  escape,
  titleCase,
  collectionLink,
} from "./catalogue";
const makingDays = catalogue.filter((p) => p.made_to_order).map((p) => p.lead_time_days);
const makingRange = `${Math.min(...makingDays)} to ${Math.max(...makingDays)}`;
const ukDelivery = `${storePolicy.deliveryDays.UK.min} to ${storePolicy.deliveryDays.UK.max}`;
const euDelivery = `${storePolicy.deliveryDays.EU.min} to ${storePolicy.deliveryDays.EU.max}`;
const closeIcon =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="m5 5 14 14M5 19 19 5"/></svg>';
const categoryLinks = [...new Set(catalogue.map((p) => p.category))]
  .map((c) => `<a data-nav-filter="category" href="${collectionLink("category", c)}">${categories[c]}</a>`)
  .join("");
const priorityOccasions = ["winter wedding", "black tie", "new year's eve"];
const occasionLink = (o: string) =>
  `<a data-nav-filter="occasion" href="${collectionLink("occasion", o)}">${escape(titleCase(o))}</a>`;
const occasionLinks =
  priorityOccasions
    .filter((o) => occasions.includes(o))
    .map(occasionLink)
    .join("") +
  `<details class="more-occasions"><summary>More occasions</summary>${occasions
    .filter((o) => !priorityOccasions.includes(o))
    .map(occasionLink)
    .join("")}</details>`;
export const header = `<a class="skip" href="#main">Skip to content</a>
<div class="announcement">From our London studio. Made for your occasion.</div>
<header><nav class="main-nav" aria-label="Main navigation">
<div class="nav-links"><button id="menu-toggle" aria-haspopup="dialog" aria-expanded="false" aria-controls="shop-navigation">Menu</button><a class="desktop-link" href="/collection.html">Collection</a><a class="desktop-link" href="/studio.html">Our studio</a></div>
<a class="wordmark" href="/" aria-label="Velmora home">VELMORA<span>LONDON</span></a>
<div class="nav-right"><button type="button" class="desktop-link" data-choose>Help me choose</button><button id="search-toggle" aria-expanded="false" aria-controls="site-search">Search</button><button id="bag-open" aria-haspopup="dialog">Bag (<span id="bag-count">0</span>)</button></div></nav>
<dialog class="nav-panel" id="shop-navigation" aria-label="Velmora menu" hidden>
<div class="nav-panel-head"><button type="button" id="menu-close" aria-label="Close menu">${closeIcon}<span>Close</span></button><a class="wordmark" href="/" aria-label="Velmora home">VELMORA<span>LONDON</span></a><button type="button" id="menu-search">Search</button></div>
<div class="menu-content"><nav class="menu-columns" aria-label="Shop and client care">
<section class="menu-occasions" aria-labelledby="menu-occasions-title"><h2 id="menu-occasions-title">By occasion</h2>${occasionLinks}</section>
<section class="menu-care" aria-labelledby="menu-care-title"><h2 id="menu-care-title">Client care</h2><a href="/client-care.html#delivery">Delivery</a><a href="/client-care.html#returns">Returns</a><a href="/client-care.html#sizing">Size & fit</a><a href="/client-care.html#making">Made to order</a><a class="menu-story" href="/studio.html">Our studio</a></section>
<section class="menu-collection" aria-labelledby="menu-collection-title"><h2 id="menu-collection-title">Collection</h2><div class="menu-category-links"><a data-nav-filter="all" href="/collection.html">View all pieces</a>${categoryLinks}</div></section>
</nav><div class="menu-assistance">${marketSelector("menu-region")}<button type="button" class="menu-adviser" data-choose>Help me choose</button></div></div></dialog>
<div class="search-panel" id="site-search" hidden><form role="search" action="/collection.html" method="get"><label for="global-search">Find your piece</label><div class="search-row"><input type="search" id="global-search" name="q" placeholder="Try silk, winter wedding or Vela" required><button type="submit">Search</button><button type="button" id="search-close" aria-label="Close search">${closeIcon}</button></div></form></div></header>`;
export const footer = `<footer><div class="footer-brand"><a class="footer-logo" href="/">VELMORA</a><p>Evening pieces. A London point of view.</p></div><div class="footer-links"><section><h2>Explore</h2><a href="/collection.html">The collection</a><a href="/studio.html">Our studio</a><a href="${collectionLink("occasion", "winter wedding")}">Winter weddings</a><a href="${collectionLink("occasion", "black tie")}">Black tie</a></section><section><h2>Client care</h2><button type="button" class="footer-adviser" data-choose>Help me choose</button><a href="/client-care.html#making">Made to order</a><a href="/client-care.html#sizing">Size & fit</a><a href="/client-care.html#delivery">Delivery</a><a href="/client-care.html#returns">Returns</a></section></div><div class="footer-bottom"><span>VELMORA · LONDON</span>${marketSelector("footer-region")}${pricingNote()}</div></footer>
<dialog id="bag-dialog" aria-labelledby="bag-title"><div class="dialog-head"><h2 id="bag-title">Your bag</h2><button data-close aria-label="Close bag">${closeIcon}</button></div><div id="bag-items" aria-live="polite"></div><p class="small">Online checkout is currently unavailable.</p><button data-close class="continue-shopping">Continue browsing</button></dialog>`;
export const studioPage = `<main id="main" tabindex="-1"><section class="studio story"><div class="studio-art"><img src="/images/vela.webp" alt="The Vela dress in oxblood crepe" fetchpriority="high" width="1024" height="1536"></div><div class="studio-copy"><h1>Evenings,<br><em>considered.</em></h1><p>Velmora is a London eveningwear label, launched in October 2025. We make pieces for the occasions that stay with you: a winter wedding, a black-tie dinner, the last evening of the year.</p><p>Fabric, fit and time to make come first. Most pieces are made to order in our London studio, with the making time shown on each piece.</p><a class="text-link" href="/collection.html">Explore the collection</a></div></section><section class="reading-section"><h2>A little time.<br><em>Something of your own.</em></h2><p>Most made-to-order pieces take ${makingRange} days to make, before delivery. Selected pieces and accessories are available from stock. Each product page tells you which applies.</p><a class="text-link" href="/client-care.html#making">About made to order</a></section></main>`;
export const carePage = `<main id="main" tabindex="-1" class="care-page"><div class="page-heading"><h1>Client care</h1><p>A little clarity, before you choose.</p></div><div class="care-layout"><aside aria-label="Client care topics"><a href="#making">Made to order</a><a href="#sizing">Size & fit</a><a href="#delivery">Delivery</a><a href="#returns">Returns</a></aside><div class="care-content"><section id="making"><h2>Made to order</h2><p>Most Velmora pieces are made to order in our London studio. The making time is shown on each product page, usually ${makingRange} days. Allow for delivery after this.</p><p>Selected pieces and accessories are available from stock. Look for “In stock” on the product page and check the time before shipping.</p></section><section id="sizing"><h2>Size & fit</h2><p>Clothing is offered in UK sizes 6 to 18. The available sizes, fabric and cut are listed on each piece. Compare the supplied cut with the silhouette you prefer: fitted, draped or relaxed.</p><table class="size-reference-table"><caption>UK and EU size reference</caption><thead><tr><th scope="col">UK label</th><th scope="col">EU reference</th></tr></thead><tbody>${Object.entries(storePolicy.sizeReference.ukToEu).map(([uk, eu]) => `<tr><th scope="row">${uk}</th><td>${eu}</td></tr>`).join("")}</tbody></table><p>${storePolicy.sizeReference.note}</p><p>We do not currently publish garment measurements, so we cannot guarantee fit from a size label alone.</p><a class="text-link" href="/collection.html">Browse by size</a></section><section id="delivery"><h2>Delivery</h2><p>After making, UK delivery takes ${ukDelivery} days. Delivery to the EU takes ${euDelivery} days. For in-stock pieces, allow the time before shipping shown on the product page, followed by delivery. Making time and delivery time are separate: please allow for both when choosing for an occasion.</p><p>These are estimated timeframes, rather than a guaranteed arrival date.</p></section><section id="returns"><h2>Returns</h2><p>Pieces can be returned within ${storePolicy.returns.days} days, ${storePolicy.returns.condition}.</p><p>Made-to-order pieces in a non-standard size cannot be returned. Consider your fit and occasion timing before choosing.</p></section></div></div></main>`;
export function bindNavigation() {
  const menu = document.querySelector<HTMLDialogElement>("#shop-navigation")!;
  const search = document.querySelector<HTMLElement>("#site-search")!;
  const menuButton = document.querySelector<HTMLButtonElement>("#menu-toggle")!;
  const searchButton =
    document.querySelector<HTMLButtonElement>("#search-toggle")!;
  const close = (
    panel: HTMLElement,
    button: HTMLButtonElement,
    restore = false,
  ) => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restore) button.focus();
  };
  const syncMenu = () => {
    menu.hidden = !menu.open;
    menuButton.setAttribute("aria-expanded", String(menu.open));
  };
  const closeMenu = () => {
    menu.close();
    syncMenu();
  };
  menu.addEventListener("close", syncMenu);
  menuButton.onclick = () => {
    close(search, searchButton);
    menu.hidden = false;
    // Native modal navigation isolates page content and contains keyboard focus.
    menu.showModal();
    syncMenu();
    menu.querySelector<HTMLAnchorElement>(".menu-columns a")!.focus();
  };
  searchButton.onclick = () => {
    const opening = search.hidden;
    if (menu.open) closeMenu();
    search.hidden = !opening;
    searchButton.setAttribute("aria-expanded", String(opening));
    if (opening)
      document.querySelector<HTMLInputElement>("#global-search")!.focus();
  };
  document.querySelector<HTMLButtonElement>("#menu-close")!.onclick = closeMenu;
  document.querySelector<HTMLButtonElement>("#menu-search")!.onclick = () => {
    closeMenu();
    searchButton.click();
  };
  document.querySelector<HTMLButtonElement>("#search-close")!.onclick = () =>
    close(search, searchButton, true);
  // Close before the adviser's own click handler opens its dialog, avoiding stacked modals.
  menu.addEventListener("click", (event) => {
    if ((event.target as Element).closest("[data-choose]")) closeMenu();
  }, { capture: true });
  // Dismiss only a gesture that starts and ends on the backdrop, not a drag from a link.
  const onBackdrop = (event: PointerEvent) => {
    const bounds = menu.getBoundingClientRect();
    return event.target === menu && (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom);
  };
  let backdropPointer: number | null = null;
  menu.addEventListener("pointerdown", (event) => {
    backdropPointer = onBackdrop(event) ? event.pointerId : null;
  });
  menu.addEventListener("pointerup", (event) => {
    if (backdropPointer === event.pointerId && onBackdrop(event)) closeMenu();
    backdropPointer = null;
  });
  menu.addEventListener("pointercancel", () => { backdropPointer = null; });
  menu.addEventListener("click", (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const target = new URL(link.href);
    closeMenu();
    if (target.pathname === location.pathname && target.hash) {
      const section = document.getElementById(target.hash.slice(1));
      if (section) { section.tabIndex = -1; section.focus({ preventScroll: true }); }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !search.hidden) close(search, searchButton, true);
  });
  document.addEventListener("click", (e) => {
    if (!(e.target as Element).closest("header")) close(search, searchButton);
  });
  document.querySelector("header")!.addEventListener("focusout", (e) => {
    if (e.relatedTarget instanceof Node && !document.querySelector("header")!.contains(e.relatedTarget))
      close(search, searchButton);
  });
  const updateCurrentLinks = () => {
    const current = new URL(location.href);
    const productCategory = catalogue.find(p => p.id === current.searchParams.get('id'))?.category;
    document.querySelectorAll<HTMLAnchorElement>('header a[href], footer a[href], .care-layout aside a[href]').forEach(a => {
      const state = navigationState(new URL(a.href), current, a.dataset.navFilter, productCategory);
      if (state) a.setAttribute('aria-current', state);
      else a.removeAttribute('aria-current');
    });
    const activeMore = menu.querySelector<HTMLDetailsElement>('.more-occasions:has([aria-current])');
    if (activeMore) activeMore.open = true;
  };
  updateCurrentLinks();
  window.addEventListener('hashchange', updateCurrentLinks);
}
