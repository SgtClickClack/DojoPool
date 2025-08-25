// Centralized accessor for the Google Maps API key used in the web app.
// This makes the key easy to locate and supports a couple of legacy env var names
// that may exist across the monorepo.

let warned = false;

/**
 * Returns the Google Maps API key from environment variables with sensible fallbacks.
 * Priority:
 * 1) NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (preferred for Next.js)
 * 2) REACT_APP_GOOGLE_MAPS_API_KEY (legacy CRA pattern)
 * 3) GOOGLE_MAPS_API_KEY (generic)
 */
export function getGoogleMapsApiKey(): string {
  // In Next.js, NEXT_PUBLIC_* vars are inlined at build time for the client.
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process as any)?.env?.REACT_APP_GOOGLE_MAPS_API_KEY ||
    (process as any)?.env?.GOOGLE_MAPS_API_KEY ||
    '';

  if (!key && typeof window !== 'undefined' && !warned) {
    // Only warn once per session to avoid noisy logs.
    console.warn(
      '[DojoPool] Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local (project root or apps/web).'
    );
    warned = true;
  }

  return key;
}

export default getGoogleMapsApiKey;
