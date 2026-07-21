/** Navigation helpers. Navigation is intentionally a full page load, which is
 *  what keeps the tool router- and framework-agnostic. */

/** Navigate to a URL via a full page load. */
export function navigate(url: string): void {
  window.location.assign(url);
}

/** Best-effort test of whether an entry URL corresponds to the current location.
 *  Compares pathname + search, ignoring origin and hash, and tolerating a
 *  trailing slash. Used only for optional active highlighting / openOnFirstLoad. */
export function isActive(url: string): boolean {
  try {
    const target = new URL(url, window.location.href);
    const here = window.location;
    const norm = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);
    return norm(target.pathname) === norm(here.pathname) && target.search === here.search;
  } catch {
    return false;
  }
}
