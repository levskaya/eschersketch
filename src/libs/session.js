import { networkConfig } from '../config.js';

let cachedToken = null;
let tokenExpiresAt = 0;
let pendingFetch = null;

/**
 * Fetch a fresh signed HMAC session token from the backend
 */
async function fetchNewSessionToken() {
  const url = networkConfig.SessionEndpoint || '/api/session';
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('Session endpoint returned status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data && data.sessionToken) {
      cachedToken = data.sessionToken;
      tokenExpiresAt = data.expiresAt || (Date.now() + 25 * 60 * 1000);
      return cachedToken;
    }
  } catch (err) {
    console.warn('Failed to fetch session token:', err);
  }
  return null;
}

/**
 * Get a valid session token, reusing cached token if not expired
 */
export async function getSessionToken(forceRefresh = false) {
  const now = Date.now();
  // Refresh if forced, missing, or expires within 2 minutes
  if (!forceRefresh && cachedToken && tokenExpiresAt - now > 2 * 60 * 1000) {
    return cachedToken;
  }

  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = fetchNewSessionToken().finally(() => {
    pendingFetch = null;
  });

  return pendingFetch;
}

/**
 * Clear cached session token (e.g. if rejected by server)
 */
export function invalidateSessionToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
