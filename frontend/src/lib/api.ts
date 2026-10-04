import { supabase } from './supabase'
import type { Listing, Match, Skill } from '../types'

const API_URL = import.meta.env.VITE_API_URL

/** Thrown when there is no Supabase session to authenticate the request with. */
export const SIGN_IN_REQUIRED = 'Please sign in to see the board.'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabase) {
    throw new Error(SIGN_IN_REQUIRED)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error(SIGN_IN_REQUIRED)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }

  return response.json() as Promise<T>
}

// CONTRACT.md: every error but 422 returns { detail: "message" }, safe to show as is.
async function errorMessage(response: Response): Promise<string> {
  if (response.status === 401) return SIGN_IN_REQUIRED
  if (response.status === 422) return 'Something was wrong with that request.'
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') return body.detail
  } catch {
    // Fall through to the status code.
  }
  return `Could not reach the board (HTTP ${response.status}).`
}

export function getFeed(category?: string): Promise<Listing[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch<Listing[]>(`/feed${query}`)
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
