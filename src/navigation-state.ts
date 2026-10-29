/** Section matching is independent of query order and unrelated shopping filters. */
export function navigationState(target: URL, current: URL, filter?: string, productCategory?: string): 'page' | 'true' | null {
  if (target.origin !== current.origin) return null;
  const product = current.pathname === '/product.html';
  const collection = current.pathname === '/collection.html';
  const context = new URLSearchParams(product ? current.searchParams.get('collection') ?? current.search : current.search);
  if (filter === 'all') {
    const narrowing = ['category', 'occasion', 'colour', 'size', 'fabric', 'fit', 'stock', 'q'];
    return collection && !narrowing.some(key => context.has(key)) ? 'page' : null;
  }
  if (filter === 'category' || filter === 'occasion') {
    if (!product && !collection) return null;
    const selected = context.get(filter) ?? (filter === 'category' ? productCategory : undefined);
    return selected && target.searchParams.get(filter) === selected ? 'true' : null;
  }
  if (target.pathname === '/collection.html' && !target.search && !target.hash) {
    return collection ? 'page' : product ? 'true' : null;
  }
  if (target.pathname !== current.pathname) return null;
  if (target.hash) return target.hash === current.hash ? 'true' : null;
  const a = new URLSearchParams(target.search), b = new URLSearchParams(current.search);
  a.sort(); b.sort();
  return a.toString() === b.toString() ? 'page' : null;
}
