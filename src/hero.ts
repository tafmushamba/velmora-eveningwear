/** Keep the persistent adviser available after the inline campaign actions leave view. */
export function bindCampaign(): void {
  const actions = document.querySelector<HTMLElement>('.campaign-actions');
  if (!actions) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      document.body.toggleAttribute('data-campaign-actions-visible', entry.isIntersecting);
    }
  });
  observer.observe(actions);
}
