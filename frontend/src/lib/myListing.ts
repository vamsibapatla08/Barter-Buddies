// Which listing this browser should offer when proposing a trade.
//
// localStorage belongs to the browser, not the account, so the id is stored
// together with the user it belongs to. Without that, signing in as a second
// account on the same browser would propose the first account's listing and the
// backend would answer 400 "requester_listing_id must be your active offer".

const KEY = 'myListingId'

type Stored = { userId: string; listingId: string }

function read(): Stored | string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.userId === 'string' && typeof parsed.listingId === 'string') {
        return parsed as Stored
      }
    } catch {
      // Written before the id was scoped to a user: a bare listing id.
      return raw
    }
    return null
  } catch {
    // Private mode, or site data blocked.
    return null
  }
}

/**
 * The listing id to offer as yours, or null.
 *
 * A legacy unscoped value is returned so the owner check can still run against
 * the API; anything stored for a different user is ignored outright.
 */
export function getMyListingId(userId: string | null): string | null {
  const stored = read()
  if (stored === null) return null
  if (typeof stored === 'string') return stored
  if (!userId) return null
  return stored.userId === userId ? stored.listingId : null
}

export function setMyListingId(userId: string, listingId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ userId, listingId } satisfies Stored))
  } catch {
    // Not fatal: the card just will not reappear on the next visit.
  }
}

export function clearMyListingId(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to do.
  }
}
