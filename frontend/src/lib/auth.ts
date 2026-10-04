import { supabase } from './supabase'

export type SignInRequest = { email: string; password: string }
export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'credentials' | 'network' | 'server' }
export type SignUpRequest = { email: string; password: string }
export type SignUpResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'unavailable' | 'credentials' | 'network' | 'server' }

export function isUtsaEmail(email: string): boolean {
  return /^[^\s@]+@my\.utsa\.edu$/i.test(email.trim())
}

// CONTRACT.md specifies browser-to-Supabase login. Replace this adapter if that
// contract changes; the UI only consumes this result and never receives tokens.
// Supabase manages the session. Never persist or log the submitted password.
export const auth = {
  isConfigured: Boolean(supabase),
  async signIn(credentials: SignInRequest): Promise<SignInResult> {
    if (!supabase) return { ok: false, reason: 'unavailable' }
    if (!isUtsaEmail(credentials.email)) return { ok: false, reason: 'credentials' }
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      if (error) {
        if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
          return { ok: false, reason: 'network' }
        }
        return { ok: false, reason: error.status && error.status >= 500 ? 'server' : 'credentials' }
      }
      return data.session ? { ok: true } : { ok: false, reason: 'server' }
    } catch {
      return { ok: false, reason: 'network' }
    }
  },
  async signUp(credentials: SignUpRequest): Promise<SignUpResult> {
    if (!supabase) return { ok: false, reason: 'unavailable' }
    if (!isUtsaEmail(credentials.email)) return { ok: false, reason: 'credentials' }
    try {
      const { data, error } = await supabase.auth.signUp(credentials)
      if (error) {
        if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
          return { ok: false, reason: 'network' }
        }
        return { ok: false, reason: error.status && error.status >= 500 ? 'server' : 'credentials' }
      }
      if (!data.user) return { ok: false, reason: 'server' }
      return { ok: true, userId: data.user.id }
    } catch {
      return { ok: false, reason: 'network' }
    }
  },
  async signOut(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}
