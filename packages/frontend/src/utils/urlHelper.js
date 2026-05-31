export const getBeautifulMenuUrl = (restaurante, origin = window.location.origin) => {
  if (!restaurante) return '';
  const country = restaurante.pais ? restaurante.pais.toLowerCase() : '';
  let displaySlug = restaurante.slug;
  if (country && displaySlug.endsWith(`-${country}`)) {
    displaySlug = displaySlug.substring(0, displaySlug.length - country.length - 1);
  }
  const prefix = country ? `/${country}` : '';
  return `${origin}${prefix}/${displaySlug}`;
}
