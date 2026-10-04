import { supabase } from './supabase'
import type { CreatedListing, Listing, ListingCreateIn, Match, Skill } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const SUPABASE_NOT_CONFIGURED =
  'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
export const NOT_SIGNED_IN = 'You are not signed in. Please sign in again.'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabase) {
    throw new Error(SUPABASE_NOT_CONFIGURED)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error(NOT_SIGNED_IN)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // Spread last so options.headers can never clobber the token.
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error(await errorMessage(path, response))
  }

  return response.json() as Promise<T>
}

// CONTRACT.md: every error but 422 returns { detail: "message" }, safe to show as is.
// A 401 reads the body too, so the backend's own reason is never hidden.
async function errorMessage(path: string, response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')
  let detail = ''
  try {
    const body = JSON.parse(raw)
    if (typeof body?.detail === 'string') detail = body.detail
  } catch {
    // Not JSON; fall back to the raw text below.
  }

  console.error(`API ${response.status} on ${path}:`, raw || '(empty body)')

  if (response.status === 401) {
    return `The server rejected your login: ${detail || raw || `HTTP ${response.status}`}`
  }
  if (response.status === 422) return 'Something was wrong with that request.'
  if (detail) return detail
  return `Could not reach the board (HTTP ${response.status}).`
}

export function getFeed(category?: string): Promise<Listing[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch<Listing[]>(`/feed${query}`)
}

export function createListing(body: ListingCreateIn): Promise<CreatedListing> {
  return apiFetch<CreatedListing>('/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSkills(): Promise<Skill[]> {
  return apiFetch<Skill[]>('/skills').catch(async apiError => {
    if (!supabase) throw apiError

    const { data, error } = await supabase
      .from('skills')
      .select('id, label, category')
      .order('category')
      .order('label')

    if (error) throw apiError
    return data as Skill[]
  })
}

export function getMatches(): Promise<Match[]> {
  return apiFetch<Match[]>('/matches')
}
