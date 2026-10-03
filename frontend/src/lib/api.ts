import type { Listing, Match } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error('Something was wrong with that request.')
    }

    const error = (await response.json()) as { detail?: string }
    throw new Error(error.detail ?? 'Something went wrong.')
  }

  return response.json() as Promise<T>
}

export function getFeed(category?: string): Promise<Listing[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return request<Listing[]>(`/feed${query}`)
}

export function getMatches(): Promise<Match[]> {
  return request<Match[]>('/matches')
}
