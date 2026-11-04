/**
 * Magic-link tokens arrive in the URL fragment (`/manage#t=<token>`). Fragments are
 * never sent to servers or in `Referer`, but they do persist in browser history and
 * can leak via screenshots or shared URLs. We therefore read the token once, move
 * it to `sessionStorage` (tab-scoped, cleared when the tab closes) and strip it from
 * the address bar.
 */

export type TokenPurpose = "verify" | "manage" | "intake" | "status";

const STORAGE_PREFIX = "aura:token:";

/** Extracts `t` from a `#t=...` fragment. Exported for tests. */
export function parseFragmentToken(hash: string): string | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const token = params.get("t");
  return token !== null && token.length > 0 ? token : null;
}

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Returns the token for a purpose: from the fragment if present (persisting it and
 * clearing the address bar), otherwise from this tab's `sessionStorage`.
 */
export function consumeToken(purpose: TokenPurpose): string | null {
  const storage = safeStorage();
  const fromHash = parseFragmentToken(window.location.hash);

  if (fromHash !== null) {
    storage?.setItem(`${STORAGE_PREFIX}${purpose}`, fromHash);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    return fromHash;
  }

  return storage?.getItem(`${STORAGE_PREFIX}${purpose}`) ?? null;
}

export function clearToken(purpose: TokenPurpose): void {
  safeStorage()?.removeItem(`${STORAGE_PREFIX}${purpose}`);
}

/**
 * Turns an absolute magic link returned by the API into an in-app path, restricted
 * to the routes this app serves. Protects against the API's `frontend_url` pointing
 * at the wrong origin and against open redirects.
 */
export function toInternalLink(
  absoluteUrl: string,
  allowedPaths: readonly string[],
): string | null {
  try {
    const url = new URL(absoluteUrl);
    return allowedPaths.includes(url.pathname) ? `${url.pathname}${url.hash}` : null;
  } catch {
    return null;
  }
}
