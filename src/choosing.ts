import {priceMarkup, sizeMarkup, pricingNote, sizeReferenceNote, updateMarket} from './market-ui';
import {sizeLabel} from './market';
import { catalogue, escape, occasions, titleCase, type Product } from './catalogue';
import { readRegion, isRegion, estimateDelivery, deliverySummary, deliveryBreakdown, type Region } from './delivery';
import colours from './colour-manifest.json';
import { defaultPreferences, candidateSchema, type AdviserPreferences, type AdviserReply } from '../shared/adviser';
import { collectionParams } from './catalogue';
export type Preferences = { occasion: string; size: string; budget: number | null; region: Region };
export function findPieces(preferences: Preferences, currentId?: string): Product[] {
  return catalogue.filter(p => estimateDelivery(p, preferences.region) &&
    (!preferences.occasion || p.occasions.includes(preferences.occasion)) &&
    (!preferences.size || p.sizes.includes(preferences.size)) &&
    (preferences.budget === null || p.price_gbp <= preferences.budget))
    .sort((a,b) => Number(b.id === currentId) - Number(a.id === currentId) || estimateDelivery(a,preferences.region)!.total.max - estimateDelivery(b,preferences.region)!.total.max);
}
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function daysUntil(value: string, today = localDate()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) return null;
  return Math.round((date.getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
}
export function eventMessage(value: string) {
  const days = daysUntil(value);
  if (days === null) return 'Choose your event date to compare how much time you have.';
  if (days < 0) return 'This date has passed. Please choose an upcoming event.';
  return `${days === 0 ? 'Your event is today' : `Your event is ${days} calendar ${days === 1 ? 'day' : 'days'} away`}. Delivery estimates do not specify working or calendar days. Arrival before your event cannot be confirmed here.`;
}
const option = (value:string) => `<option value="${escape(value)}">${escape(titleCase(value))}</option>`;
type ScreenRect = Pick<DOMRectReadOnly, 'left' | 'right' | 'top' | 'bottom'>;
export function launcherLift(launcher: ScreenRect, purchase: ScreenRect, gap: number): number {
  const overlaps = launcher.left < purchase.right && launcher.right > purchase.left &&
    launcher.top < purchase.bottom && launcher.bottom > purchase.top;
  return overlaps ? Math.max(0, launcher.bottom - purchase.top + gap) : 0;
}
const adviserLauncher = `<button type="button" id="adviser-launcher" class="adviser-launcher" data-choose aria-haspopup="dialog" aria-controls="choosing-dialog"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/></svg><span>Help me choose</span></button>`;
function bindAdviserLauncher() {
  const launcher = document.querySelector<HTMLButtonElement>('#adviser-launcher')!;
  const purchase = document.querySelector<HTMLButtonElement>('#product-form > .primary');
  if (!purchase) return;
  let lift = 0, scheduled = false;
  const update = () => {
    scheduled = false;
    if (!launcher.getClientRects().length) return;
    const rect = launcher.getBoundingClientRect();
    // Compare the undocked position so moving above a control cannot cause oscillation.
    const natural = { left:rect.left, right:rect.right, top:rect.top+lift, bottom:rect.bottom+lift };
    const gap = Number.parseFloat(getComputedStyle(launcher).getPropertyValue('--adviser-clearance'));
    const next = launcherLift(natural, purchase.getBoundingClientRect(), gap);
    if (next !== lift) { lift = next; launcher.style.setProperty('--adviser-lift', `${lift}px`); }
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(launcher); resize.observe(purchase); resize.observe(document.body);
  const visibility = new MutationObserver(schedule);
  document.querySelectorAll('dialog, #shop-navigation, #site-search').forEach(panel =>
    visibility.observe(panel, {attributes:true, attributeFilter:['hidden','open']}));
  schedule();
}
export const choosingDialog = adviserLauncher + `<dialog id="choosing-dialog" aria-labelledby="choosing-title">
<header class="choosing-heading"><h2 id="choosing-title" tabindex="-1" autofocus>Help me choose</h2><button type="button" id="choosing-close" aria-label="Close choosing help">Close</button></header>
<div id="adviser-chat-view">
<div class="adviser-tools"><button type="button" id="adviser-preferences" aria-controls="adviser-preferences-view">Preferences<span id="adviser-preferences-summary"></span></button><button type="button" id="adviser-about" aria-expanded="false" aria-controls="adviser-privacy">About AI</button></div>
<div class="adviser-scroll" tabindex="0" role="region" aria-label="Shopping advice">
<p id="adviser-privacy" hidden>AI advice can be mistaken. Messages are sent to OpenAI; please leave out personal information. Closing this panel keeps your conversation on this page. Stop cancels a reply.</p>
<div id="adviser-intro"><p id="choosing-context">Tell me your occasion, a colour or your budget.</p><div class="adviser-suggestions" aria-label="Ideas to start"></div><p class="adviser-intro-note">AI advice can be mistaken. Messages are sent to OpenAI; please leave out personal information.</p></div>
<div id="adviser-conversation" role="log" aria-label="Your conversation" aria-live="polite" aria-relevant="additions"></div><p id="adviser-status" role="status"></p><div id="adviser-error" hidden><p role="alert" id="adviser-error-message"></p><div class="adviser-recovery"><button type="button" id="adviser-retry">Retry message</button><a href="/collection.html">Browse the collection</a></div></div>
</div>
<form id="adviser-form"><label class="adviser-input-label" for="adviser-message">Your message</label><textarea id="adviser-message" name="message" rows="1" maxlength="1200" required placeholder="Tell me what you have in mind…"></textarea><button class="adviser-send" type="submit" aria-label="Send message">Send</button><button type="button" id="adviser-stop" hidden>Stop</button></form>
</div>
<section id="adviser-preferences-view" aria-labelledby="preferences-title" hidden><h3 id="preferences-title" tabindex="-1">Your preferences</h3><form id="choosing-form"><div class="choosing-fields"><label>Occasion<select name="occasion"><option value="">Any occasion</option>${occasions.map(option).join('')}</select></label><label>Your size<select name="size"><option value="">Any size</option>${[...new Set(catalogue.filter(p => p.category !== 'accessory').flatMap(p => p.sizes))].map(option).join('')}<option value="one size">One size / accessories</option></select></label><label>Maximum budget in GBP (£)<input name="budget" type="number" min="0" max="100000" step="0.01" inputmode="decimal" placeholder="No limit"></label><label>Deliver to<select name="region"><option value="UK">United Kingdom</option><option value="EU">European Union</option></select></label></div><p class="adviser-budget-note">Budgets are in GBP. Euro prices, where shown, are estimates.</p>${pricingNote(defaultPreferences.region)}${sizeReferenceNote(defaultPreferences.region)}<p class="preferences-note">These preferences apply to your next message. You can also tell me what you need in the chat.</p><button type="button" id="adviser-reset" hidden>Start again</button><div class="preferences-actions"><button type="button" id="preferences-back">Back</button><button class="adviser-send" type="submit">Apply preferences</button></div></form></section>
</dialog>`;
export function bindChoosing(current?: Product) {
 bindAdviserLauncher();
 const dialog=document.querySelector<HTMLDialogElement>('#choosing-dialog')!;
 const form=document.querySelector<HTMLFormElement>('#choosing-form')!;
 const chat=document.querySelector<HTMLFormElement>('#adviser-form')!;
 const input=document.querySelector<HTMLTextAreaElement>('#adviser-message')!;
 const scroll=document.querySelector<HTMLElement>('.adviser-scroll')!;
 const suggestions=document.querySelector<HTMLElement>('.adviser-suggestions')!;
 const intro=document.querySelector<HTMLElement>('#adviser-intro')!;
 const status=document.querySelector<HTMLElement>('#adviser-status')!;
 const conversation=document.querySelector<HTMLElement>('#adviser-conversation')!;
 const reset=document.querySelector<HTMLButtonElement>('#adviser-reset')!;
 const errorBox=document.querySelector<HTMLElement>('#adviser-error')!;
 const errorMessage=document.querySelector<HTMLElement>('#adviser-error-message')!;
 const retry=document.querySelector<HTMLButtonElement>('#adviser-retry')!;
 const sendButton=chat.querySelector<HTMLButtonElement>('.adviser-send')!;
 const stop=document.querySelector<HTMLButtonElement>('#adviser-stop')!;
 const preferencesButton=document.querySelector<HTMLButtonElement>('#adviser-preferences')!;
 const chatView=document.querySelector<HTMLElement>('#adviser-chat-view')!;
 const preferencesView=document.querySelector<HTMLElement>('#adviser-preferences-view')!;
 const about=document.querySelector<HTMLButtonElement>('#adviser-about')!;
 const privacy=document.querySelector<HTMLElement>('#adviser-privacy')!;
 const initialPlaceholder=current?`Ask about ${current.name}…`:'Tell me what you have in mind…';
 input.placeholder=initialPlaceholder;
 let opener:HTMLElement|null=null, preferences:AdviserPreferences={...defaultPreferences};
 let history:{role:'user'|'assistant';message:string}[]=[],previousProductIds:string[]=[],controller:AbortController|null=null,opened=false,retryMessage:string|null=null,retryTurn:HTMLDivElement|null=null;
 const control=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
 const syncChoosingMarket=(region:Region)=>{
  form.querySelectorAll<HTMLOptionElement>('select[name=size] option').forEach(option=>{if(option.value)option.textContent=sizeLabel(option.value,region);});
  form.querySelectorAll<HTMLElement>('[data-pricing-note],[data-size-reference]').forEach(el=>el.dataset.displayRegion=region);
  void updateMarket(region);
 };
 const syncControls=()=>{ for(const name of ['occasion','size','region'] as const)control(name).value=preferences[name];control('budget').value=preferences.budget===null?'':String(preferences.budget);syncChoosingMarket(preferences.region); };
 const syncLayout=()=>{
  const hasTurns=conversation.childElementCount>0;
  intro.hidden=hasTurns;reset.hidden=!hasTurns;dialog.classList.toggle('is-conversing',hasTurns);
  sendButton.hidden=controller!==null;stop.hidden=controller===null;
  reset.disabled=preferencesButton.disabled=retry.disabled=controller!==null;
  document.querySelector('#adviser-preferences-summary')!.textContent=` · ${[preferences.occasion,sizeLabel(preferences.size,preferences.region),preferences.budget===null?'':`£${preferences.budget}`,preferences.region].filter(Boolean).join(' · ')}`;
 };
 const showChat=()=>{preferencesView.hidden=true;chatView.hidden=false;preferencesButton.focus();};
 const initialise=()=>{
  const params=new URLSearchParams(location.search);const nested=params.get('collection');
  const base=collectionParams(nested?new URLSearchParams(nested):params);
  preferences={...defaultPreferences,region:readRegion()};
  for(const name of ['occasion','category','size','colour','fabric','fit'] as const)preferences[name]=base.get(name)||'';
  preferences.size=document.querySelector<HTMLInputElement>('input[name=size]:checked')?.value||preferences.size;
  history=[];previousProductIds=[];retryMessage=null;retryTurn=null;conversation.replaceChildren();status.textContent='';errorBox.hidden=true;input.value='';input.placeholder=initialPlaceholder;
  preferencesView.hidden=true;chatView.hidden=false;syncControls();syncLayout();
 };
 // The visual viewport follows browser chrome and the software keyboard when supported.
 const viewport=window.visualViewport;
 const sizeDialog=()=>{
  const height=viewport?.height??window.innerHeight;
  dialog.style.setProperty('--adviser-height',`${height}px`);
  // Below the normal header/composer budget, prioritise the conversation and input.
  dialog.classList.toggle('is-compact-height',height<260);
  dialog.style.setProperty('--adviser-top',`${viewport?.offsetTop??0}px`);
 };
 viewport?.addEventListener('resize',sizeDialog);viewport?.addEventListener('scroll',sizeDialog);window.addEventListener('resize',sizeDialog);sizeDialog();
 document.querySelector('#choosing-context')!.textContent=current?`Ask about ${current.name}, or find another piece.`:'Tell me your occasion, a colour or your budget.';
 const prompts=current?[
  ['Colours',`What colours does ${current.name} come in?`],['Delivery',`How long does delivery take for ${current.name}?`],['Returns',`Can I return ${current.name}?`]
 ]:[['Winter wedding','Help me choose a dress for a winter wedding'],['Black tie','Help me choose for a black-tie dinner'],['New Year’s Eve',"Something for New Year's Eve"]];
 suggestions.innerHTML=prompts.map(([label,message])=>`<button type="button" data-prompt="${escape(message)}">${escape(label)}</button>`).join('');
 if(current)document.querySelector('#choosing-title')!.textContent=current.name;
 document.querySelectorAll<HTMLButtonElement>('[data-choose]').forEach(button=>{
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','choosing-dialog');
  button.onclick=()=>{
   opener=button.closest('#shop-navigation')?document.querySelector<HTMLElement>('#menu-toggle'):button;
   if(!opened){initialise();opened=true;}
   sizeDialog();dialog.showModal();
  };
 });
 document.querySelector('#choosing-close')!.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{
  // Closing minimises the panel; only the explicit Stop action cancels a reply.
  const focusTarget=opener?.getClientRects().length?opener:document.querySelector<HTMLElement>('#menu-toggle');focusTarget?.focus();
 });
 about.onclick=()=>{privacy.hidden=!privacy.hidden;about.setAttribute('aria-expanded',String(!privacy.hidden));if(!privacy.hidden)scroll.scrollTop=0;};
 control('region').addEventListener('change',()=>{const region=control('region').value;if(isRegion(region))syncChoosingMarket(region);});
 preferencesButton.onclick=()=>{syncControls();chatView.hidden=true;preferencesView.hidden=false;document.querySelector<HTMLElement>('#preferences-title')!.focus();};
 document.querySelector<HTMLButtonElement>('#preferences-back')!.onclick=()=>{syncControls();showChat();};
 form.onsubmit=e=>{
  e.preventDefault();const region=control('region').value;
  if(!isRegion(region)||!form.reportValidity())return;
  preferences={...preferences,occasion:control('occasion').value,size:control('size').value,budget:control('budget').value?Number(control('budget').value):null,region};
  syncLayout();showChat();
 };
 reset.onclick=()=>{if(controller)return;initialise();input.focus();};
 stop.onclick=()=>{controller?.abort();input.focus();};
 function render(reply:AdviserReply) {
  const p=reply.preferences;
  const params=collectionParams(new URLSearchParams(location.search));params.set('region',p.region);
  for(const name of ['occasion','category','size','colour','fabric','fit'] as const){if(p[name])params.set(name,p[name]);else params.delete(name);}
  if(p.sort!=='relevance')params.set('sort',p.sort==='cheaper'?'low':'soonest');
  const manifest:Record<string,Record<string,string>>=colours;
  const turn=document.createElement('div');turn.className='adviser-turn adviser-assistant';
  turn.innerHTML=`<span class="adviser-speaker">Velmora</span><p class="adviser-bubble">${escape(reply.reply)}</p>`+
   reply.productIds.map(id=>{
    const item=catalogue.find(p=>p.id===id)!;const colour=p.colour||item.colours[0];
    const target=new URLSearchParams(params);target.set('id',item.id);target.set('colour',colour);target.set('collection',params.toString());
    return `<article class="choosing-piece"><img src="/images/${manifest[item.id][colour]}" alt="${escape(item.name)} in ${escape(colour)}" width="80" height="120"><div><h3><a href="/product.html?${escape(target.toString())}">${escape(item.name)}</a></h3><p class="adviser-price">${priceMarkup(item.price_gbp,p.region)} · ${escape(item.fabric)}</p><p>${escape(item.fit?`${item.fit} fit`:'One size')} · ${item.made_to_order?'Made to order':'In stock'}</p>${p.size||item.sizes.length===1?`<p>Size: ${sizeMarkup(p.size||item.sizes[0],p.region)}</p>`:''}<p>${deliverySummary(item,p.region)}</p><p>${deliveryBreakdown(item,p.region)}</p><a class="text-link" href="/product.html?${escape(target.toString())}">View this piece</a></div></article>`;
   }).join('')+(reply.productIds.length?`${pricingNote(p.region)}${sizeReferenceNote(p.region)}<p class="adviser-budget-note">Matching budgets are in GBP.</p>`:'');
  conversation.append(turn);void updateMarket(p.region);turn.scrollIntoView({block:'start'});
 }
 async function send(message:string, clearDraft=false, reusedTurn?:HTMLDivElement) {
  if(controller||!message.trim())return;
  const active=new AbortController();controller=active;
  status.textContent='Thinking… You can write your next message or stop this reply.';errorBox.hidden=true;retryMessage=null;
  const userTurn=reusedTurn??document.createElement('div');userTurn.className='adviser-turn adviser-user';
  if(!reusedTurn){userTurn.innerHTML=`<span class="adviser-speaker">You</span><p class="adviser-bubble">${escape(message)}</p>`;conversation.append(userTurn);}
  else userTurn.querySelector('.adviser-turn-state')?.remove();
  if(clearDraft)input.value='';
  syncLayout();scroll.scrollTop=scroll.scrollHeight;
  try {
   const response=await fetch('/api/adviser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,preferences,currentProductId:current?.id??null,previousProductIds,history:history.slice(-6)}),signal:active.signal});
   const body=await response.json();
   if(active.signal.aborted)return;
   if(!response.ok)throw new Error(typeof body.error==='string'?body.error:'The adviser is unavailable. Please use the collection filters.');
   const parsed=candidateSchema.safeParse(body);
   if(!parsed.success || parsed.data.productIds.some(id=>!catalogue.some(p=>p.id===id)))throw new Error('The adviser returned an unreadable response. Please try again.');
   const reply=body as AdviserReply;
   preferences=reply.preferences;if(reply.productIds.length)previousProductIds=reply.productIds;
   history.push({role:'user',message},{role:'assistant',message:reply.reply});syncControls();render(reply);input.placeholder='Ask a follow-up…';status.textContent='';
  }catch(error){if(!active.signal.aborted){
   status.textContent='';retryMessage=message;retryTurn=userTurn;
   errorMessage.textContent=error instanceof TypeError?'Your message couldn’t be sent. Retry it below, or keep writing a new message.':error instanceof SyntaxError?'The adviser couldn’t read the reply. Retry your message below.':error instanceof Error?error.message:'The adviser is unavailable. Please retry or browse the collection.';
   errorBox.hidden=false;
   const note=document.createElement('p');note.className='adviser-turn-state';note.textContent='Reply failed';userTurn.append(note);scroll.scrollTop=scroll.scrollHeight;
  }} finally{
   if(active.signal.aborted){
    status.textContent='Reply stopped. Your message and any new draft are kept.';retryMessage=message;retryTurn=userTurn;
    const note=document.createElement('p');note.className='adviser-turn-state';note.textContent='Reply stopped';userTurn.append(note);
    errorMessage.textContent='You can retry this message when you’re ready.';errorBox.hidden=false;
   }
   if(controller===active)controller=null;syncLayout();
  }
 }
 retry.onclick=()=>{if(retryMessage){void send(retryMessage,false,retryTurn??undefined);input.focus();}};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(!controller)chat.requestSubmit();}});
 chat.onsubmit=e=>{e.preventDefault();if(chat.reportValidity())void send(input.value.trim(),true);};
 dialog.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach(button=>button.onclick=()=>{void send(button.dataset.prompt!);});
}
