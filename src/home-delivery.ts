import { catalogue, collectionUrl } from './catalogue';
import { catalogueDeliveryWindow, formatDeliverySummary, formatDeliveryBreakdown, type Region } from './delivery';
import { eventMessage, localDate } from './choosing';

const chevron = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
function windowMarkup(region: Region, madeToOrder: boolean) {
  const window = catalogueDeliveryWindow(catalogue,region,madeToOrder);
  return window ? `<strong>${formatDeliverySummary(window.total, region)}</strong><p>${formatDeliveryBreakdown(window.preparation, window.shipping, madeToOrder)}</p>` : '<p>No pieces currently available.</p>';
}
export function homeDelivery(region:Region) {
  return `<details class="home-delivery" id="delivery-planner"><summary><span class="home-delivery-title">Making &amp; delivery</span><span class="home-delivery-action">Check delivery ${chevron}</span></summary><div class="home-delivery-content"><div class="home-delivery-inputs"><h3>Allow time for both.</h3><p>Delivery estimates include preparation or making, plus shipping. Check the estimate on your chosen piece.</p><div class="home-delivery-fields"><label for="home-delivery-region">Deliver to<select id="home-delivery-region" data-market-region><option value="UK" ${region==='UK'?'selected':''}>United Kingdom</option><option value="EU" ${region==='EU'?'selected':''}>European Union</option></select></label><label for="home-event-date"><span>Your event date (optional)</span><input id="home-event-date" type="date" min="${localDate()}" aria-describedby="home-event-guidance"></label></div><p id="home-event-guidance" role="status">Choose a date to see how much time you have. Arrival before an event needs confirmation.</p></div><div class="home-delivery-results" aria-live="polite" aria-atomic="true"><div><h4>Made to order</h4><div data-home-delivery="making">${windowMarkup(region,true)}</div></div><div><h4>In-stock pieces</h4><div data-home-delivery="stock">${windowMarkup(region,false)}</div></div><p class="home-delivery-note">Estimated timeframes. Check the estimate on your chosen piece.</p><a class="inline-link" href="${collectionUrl({stock:'in-stock',sort:'soonest'})}">Shop in-stock pieces</a></div></div></details>`;
}
export function updateHomeDelivery(region:Region) {
  document.querySelectorAll<HTMLElement>('[data-home-delivery]').forEach(el=>{
    el.innerHTML=windowMarkup(region,el.dataset.homeDelivery==='making');
  });
}
export function bindHomeDelivery() {
  const date=document.querySelector<HTMLInputElement>('#home-event-date');
  if(date) date.addEventListener('change',()=>{
    document.querySelector('#home-event-guidance')!.textContent=date.value ? eventMessage(date.value) : 'Choose a date to see how much time you have. Arrival before an event needs confirmation.';
  });
}
