import { escape, titleCase, type Product } from './catalogue';
import { formatPrice } from './market';
import { catalogueDeliveryWindow, estimateDelivery, formatDeliverySummary, formatDeliveryBreakdown, type Region } from './delivery';

export type BlackFridayFilters = { occasion:string|null; budget:number|null; all:boolean };
export function readBlackFridayFilters(params:URLSearchParams, products:Product[]):BlackFridayFilters {
  const occasion=params.get('occasion');
  const raw=params.get('budget')?.trim()??'';
  const budget=/^\d+(?:\.\d{1,2})?$/.test(raw) ? Number(raw) : null;
  return {
    occasion:occasion && products.some(p=>p.occasions.includes(occasion)) ? occasion : null,
    budget:budget!==null && Number.isFinite(budget) ? budget : null,
    all:params.get('all')==='1',
  };
}
export function blackFridayUrl(filters:BlackFridayFilters, region:Region) {
  const params=new URLSearchParams({region});
  if(filters.occasion) params.set('occasion',filters.occasion);
  if(filters.budget!==null) params.set('budget',String(filters.budget));
  if(filters.all) params.set('all','1');
  return `/black-friday.html?${params}`;
}
/** Selection and budget matching use source GBP values, never indicative euro prices. */
export function blackFridaySelection(products:Product[], region:Region, filters:BlackFridayFilters={occasion:null,budget:null,all:false}) {
  const stock=products.filter(piece=>!piece.made_to_order && piece.in_stock)
    .filter(piece=>(!filters.occasion || piece.occasions.includes(filters.occasion)) && (filters.budget===null || piece.price_gbp<=filters.budget))
    .sort((a,b)=>estimateDelivery(a,region)!.total.max-estimateDelivery(b,region)!.total.max || a.id.localeCompare(b.id,'en-GB'));
  const allClothing=stock.filter(piece=>piece.category!=='accessory');
  return { clothing:allClothing.slice(0,4), allClothing, accessories:stock.filter(piece=>piece.category==='accessory') };
}

type BlackFridayOptions = {
  products:Product[]; region:Region; filters:BlackFridayFilters;
  card:(product:Product)=>string; delivery:()=>string;
  link:(updates:Record<string,string|null>)=>string; arrow:string;
};
const gbp=(value:number)=>formatPrice(value,'UK',null);
function stockGuidance(products:Product[],region:Region) {
  const window=catalogueDeliveryWindow(products,region,false);
  return window ? `<strong>${formatDeliverySummary(window.total, region)}</strong> ${formatDeliveryBreakdown(window.preparation, window.shipping, false)}` : '';
}
function results({products,region,filters,card,link,arrow}:BlackFridayOptions) {
  const {clothing,allClothing,accessories}=blackFridaySelection(products,region,filters);
  const visible=filters.all?allClothing:clothing;
  const context=[filters.occasion?titleCase(filters.occasion):'All occasions',filters.budget!==null?`up to ${gbp(filters.budget)}`:'any budget'].join(' · ');
  return `<div class="bf-result-heading"><h3 id="bf-result-title">${allClothing.length?'Your in-stock edit.':'No clothing matches yet.'}</h3><p id="bf-result-status" role="status" aria-atomic="true">${allClothing.length} in-stock clothing ${allClothing.length===1?'piece':'pieces'} · ${escape(context)}. Ordered by soonest estimated delivery.</p></div>
    ${allClothing.length?`<p class="bf-delivery-summary">${stockGuidance(allClothing,region)}</p><div class="product-grid ${visible.length===1?'bf-single-piece':visible.length===2?'bf-two-pieces':visible.length===3?'bf-three-pieces':''}" id="bf-product-grid">${visible.map(piece=>card(piece)).join('')}</div>${!filters.all&&allClothing.length>visible.length?`<button class="bf-more" type="button" data-bf-more>Show all ${allClothing.length} matching pieces ${arrow}</button>`:''}`:`<div class="bf-empty"><p>${products.some(p=>!p.made_to_order&&p.in_stock&&p.category!=='accessory')?'Try another occasion or increase your budget. We have not substituted pieces outside your choices.':'No clothing is currently available from stock. Made-to-order pieces have a longer preparation time.'}</p><a class="text-link" href="${link({occasion:filters.occasion})}">Explore the wider collection ${arrow}</a></div>`}
    ${accessories.length?`<section class="bf-accessories" aria-labelledby="bf-accessories-heading"><div class="section-heading"><h3 id="bf-accessories-heading">A finishing <em>touch.</em></h3><p>Also from stock${filters.occasion?' for this occasion':''}${filters.budget!==null?', within your per-piece budget':''}. Priced separately.</p></div><div class="product-grid">${accessories.map(piece=>card(piece)).join('')}</div></section>`:''}`;
}
export function blackFridayPage(options:BlackFridayOptions) {
  const {products,region,filters,delivery,arrow}=options;
  const hasStock=products.some(p=>!p.made_to_order&&p.in_stock&&p.category!=='accessory');
  const occasions=[...new Set(products.flatMap(p=>p.occasions))];
  const primary=['winter wedding','black tie',"new year's eve"].filter(value=>occasions.includes(value));
  const ordered=[...primary,...occasions.filter(value=>!primary.includes(value))];
  return `<main id="main" tabindex="-1" class="black-friday-page">
    <section class="campaign-hero bf-campaign" aria-labelledby="campaign-heading">
      <picture class="campaign-picture"><source media="(max-width:760px)" srcset="/images/hero-mobile.webp" width="1024" height="1536"><img src="/images/hero.webp" alt="An oxblood evening dress in a stone gallery" fetchpriority="high" width="1536" height="1024"></picture>
      <div class="campaign-content"><h1 id="campaign-heading">The Black <br>Friday <em>edit.</em></h1><p class="bf-campaign-copy">Occasion pieces at their usual prices.<br>${hasStock?'Start with what’s available from stock.':'Allow time for making and delivery.'}</p><div class="campaign-actions"><a class="campaign-shop" href="${hasStock?'#in-stock':options.link({})}">${hasStock?'Find your in-stock edit':'Explore the collection'} ${arrow}</a><button type="button" class="campaign-adviser" data-choose>Help me choose</button></div></div>
    </section>
    <section class="section bf-stock" id="in-stock" aria-labelledby="bf-stock-heading" tabindex="-1">
      <div class="bf-finder-heading"><h2 id="bf-stock-heading">Your plans. <em>Your budget.</em></h2><p>Choose your occasion. See available pieces, with their total delivery timeframe.</p></div>
      <form id="bf-finder" action="/black-friday.html" method="get" aria-label="Find in-stock pieces">
        <label for="bf-occasion">Your occasion<select id="bf-occasion" name="occasion"><option value="">Any occasion</option>${ordered.map(value=>`<option value="${escape(value)}" ${filters.occasion===value?'selected':''}>${escape(titleCase(value))}</option>`).join('')}</select></label>
        <label for="bf-budget">Maximum budget in GBP (£)<input id="bf-budget" name="budget" type="number" inputmode="decimal" min="0" step="0.01" value="${filters.budget??''}" placeholder="No maximum" aria-describedby="bf-budget-note"></label>
        <label for="bf-region">Deliver to<select id="bf-region" name="region" data-market-region><option value="UK" ${region==='UK'?'selected':''}>United Kingdom</option><option value="EU" ${region==='EU'?'selected':''}>European Union</option></select></label>
        <button type="submit" class="bf-find">Find pieces ${arrow}</button>
      </form>
      <div class="bf-finder-notes"><p id="bf-budget-note">Budget is per piece, in GBP. EU prices are indicative euro estimates.</p><button type="button" data-bf-clear ${!filters.occasion&&filters.budget===null?'disabled':''}>Clear occasion and budget</button></div>
      <div id="bf-results">${results(options)}</div>
    </section>
    <section class="bf-making section" aria-labelledby="bf-making-heading"><div><h2 id="bf-making-heading">More time? <em>Made to order.</em></h2><p>For a wider choice, allow time for making as well as delivery. Check the selected piece before planning around an event.</p></div>${delivery()}</section>
  </main>`;
}

/** Rerender only the campaign results; the form, adviser and bag keep their state. */
export function bindBlackFriday(options:Omit<BlackFridayOptions,'filters'|'region'> & {market:(region:Region)=>void}) {
  const form=document.querySelector<HTMLFormElement>('#bf-finder')!;
  const container=document.querySelector<HTMLElement>('#bf-results')!;
  const clear=document.querySelector<HTMLButtonElement>('[data-bf-clear]')!;
  function update(region:Region, focus=false) {
    const filters=readBlackFridayFilters(new URLSearchParams(location.search),options.products);
    container.innerHTML=results({...options,region,filters});
    clear.disabled=!filters.occasion&&filters.budget===null;
    options.market(region);
    if(focus) { const heading=container.querySelector<HTMLElement>('#bf-result-title')!;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'auto'}); }
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const params=new URLSearchParams();
    const data=new FormData(form);
    params.set('occasion',String(data.get('occasion')??''));
    const budget=form.querySelector<HTMLInputElement>('#bf-budget')!;
    params.set('budget',budget.value===''?'':String(budget.valueAsNumber));
    const filters=readBlackFridayFilters(params,options.products);
    const region=form.querySelector<HTMLSelectElement>('#bf-region')!.value as Region;
    history.replaceState(null,'',blackFridayUrl(filters,region)+'#in-stock');
    update(region,true);
  });
  clear.addEventListener('click',()=>{
    form.querySelector<HTMLSelectElement>('#bf-occasion')!.value='';
    form.querySelector<HTMLInputElement>('#bf-budget')!.value='';
    const region=form.querySelector<HTMLSelectElement>('#bf-region')!.value as Region;
    history.replaceState(null,'',blackFridayUrl({occasion:null,budget:null,all:false},region)+'#in-stock');
    update(region,true);
  });
  container.addEventListener('click',event=>{
    if(!(event.target instanceof Element)||!event.target.closest('[data-bf-more]')) return;
    const region=form.querySelector<HTMLSelectElement>('#bf-region')!.value as Region;
    const filters=readBlackFridayFilters(new URLSearchParams(location.search),options.products);
    history.replaceState(null,'',blackFridayUrl({...filters,all:true},region)+'#in-stock');
    const currentCount=container.querySelectorAll('#bf-product-grid article').length;
    update(region);
    container.querySelector<HTMLAnchorElement>(`#bf-product-grid article:nth-child(${currentCount+1}) a`)?.focus();
  });
  return update;
}
