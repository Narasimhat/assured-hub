import { useCallback, useEffect, useState } from 'react';

/**
 * Hash routing, with no dependency.
 *
 * Path routing is not an option here: the same build is served standalone at `/` (its own Vercel
 * project, which rewrites everything to index.html) and bundled under `/academy/` by
 * scripts/build-hub.mjs with Vite `base: './'`. A hash route is identical in both.
 *
 * Routes are "/", "/tier/<persona>", and "/workbench" | "/simulator" | "/missions" | "/tools" | "/frugal".
 */

export const HOME_ROUTE = '/';

/** Normalise whatever is in location.hash to a leading-slash path with no trailing slash. */
export function normalise(hash: string): string {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw || raw === '/') return HOME_ROUTE;
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const trimmed = withSlash.replace(/\/+$/, '');
  return trimmed === '' ? HOME_ROUTE : trimmed;
}

export function currentRoute(): string {
  if (typeof window === 'undefined') return HOME_ROUTE;
  return normalise(window.location.hash);
}

export function navigate(route: string): void {
  if (typeof window === 'undefined') return;
  const next = normalise(route);
  if (currentRoute() === next) return;
  window.location.hash = next;
}

/** The persona id in "/tier/<id>", or null for any other route. */
export function personaIdFromRoute(route: string): string | null {
  const match = /^\/tier\/([a-z-]+)$/.exec(route);
  return match ? match[1] : null;
}

export function useHashRoute(): [string, (route: string) => void] {
  const [route, setRoute] = useState<string>(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    // The hash may already have been set before React mounted.
    onChange();
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // Move focus to the main region on every route change, so a keyboard user is not left
  // at the top of a navigation list that did not change.
  useEffect(() => {
    if (route === HOME_ROUTE) return;
    const main = document.getElementById('academy-main');
    main?.focus();
  }, [route]);

  const go = useCallback((next: string) => navigate(next), []);
  return [route, go];
}
