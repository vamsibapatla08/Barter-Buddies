import { supabase } from './supabase'
import type { Listing, Match } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('SESSION:', session)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(session?.access_token
        ? {
            Authorization: 'Bearer ' + session.access_token,
          }
        : {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getFeed(category?: string): Promise<Listing[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch<Listing[]>(`/feed${query}`)
}

export function getMatches(): Promise<Match[]> {
  return apiFetch<Match[]>('/matches')
}
