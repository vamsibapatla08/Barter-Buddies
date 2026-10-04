import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { auth, isUtsaEmail } from '../lib/auth'
import './LoginPage.css'

const messages = {
  unavailable: 'Sign-in is not available yet. Please try again later.',
  credentials: 'Those credentials could not be verified.',
  network: 'We could not connect. Check your connection and try again.',
  server: 'We could not sign you in right now. Please try again.',
}

export default function LoginPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])

  useLayoutEffect(() => {
    const root = board.current
    if (!root) return
    const update = () => {
      const origin = root.getBoundingClientRect()
      const pinPosition = (selector: string) => {
        const pin = root.querySelector<HTMLElement>(selector)
        if (!pin?.getClientRects().length) return null
        const rect = pin.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - origin.left + root.scrollLeft,
          y: rect.top + rect.height / 2 - origin.top + root.scrollTop,
        }
      }
      const top = pinPosition('.login-brand .login-thread-pin')
      const left = pinPosition('.login-board-note-left .login-thread-pin')
      const right = pinPosition('.login-board-note-right .login-thread-pin')
      const ticket = pinPosition('.login-exchange-ticket .login-thread-pin')
      const wanted = pinPosition('.login-wanted-note .login-thread-pin')
      if (!top || !left || !right) {
        setThreads([])
        return
      }
      const connections = [[top, left], [top, right]]
      if (ticket) connections.push([left, ticket])
      if (wanted) connections.push([right, wanted])
      setThreads(connections.map(([start, end]) => {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const length = Math.hypot(dx, dy)
        // Stop at the pin rims so the string appears held under the brass heads.
        const inset = 5.5 / length
        const startX = start.x + dx * inset
        const startY = start.y + dy * inset
        const endX = end.x - dx * inset
        const endY = end.y - dy * inset
        return `M ${startX} ${startY} Q ${(startX + endX) / 2} ${(startY + endY) / 2 + 2} ${endX} ${endY}`
      }))
    }
    const observer = new ResizeObserver(update)
    observer.observe(root)
    root.querySelectorAll('.login-wrap, .login-brand, .login-board-note, .login-exchange-ticket, .login-wanted-note').forEach(node => observer.observe(node))
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [pending, setPending] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const emailInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)

  const emailError = !email.trim()
    ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter a valid email address.'
      : !isUtsaEmail(email)
        ? 'Use your @my.utsa.edu email address.' : ''
  const passwordError = password ? '' : 'Enter your password.'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || signedIn) return
    setTouched({ email: true, password: true })
    setError('')
    if (emailError || passwordError) {
      const invalidInput = emailError ? emailInput : passwordInput
      invalidInput.current?.focus()
      return
    }
    submitting.current = true
    setPending(true)
    try {
      const result = await auth.signIn({ email: email.trim(), password })
      if (result.ok) {
        setPassword('')
        setSignedIn(true)
      } else {
        setError(messages[result.reason])
      }
    } catch {
      setError(messages.server)
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <main className="login-page" ref={board}>
      <svg className="login-thread-overlay" aria-hidden="true" focusable="false">
        {threads.map((path, index) => (
          <g key={index}>
            <path className="login-thread-edge" d={path} />
            <path className="login-thread-core" d={path} />
            <path className="login-thread-fiber" d={path} />
          </g>
        ))}
      </svg>
      <div className="login-board-notes" aria-hidden="true">
        <div className="login-filmstrip">
          <div className="login-film-frame"><img src="/images/doorway-contact.png" alt="" width="240" height="145" draggable={false} /></div>
          <div className="login-film-detail"><img src="/images/doorway-contact.png" alt="" width="100" height="145" draggable={false} /></div>
          <span className="login-film-reference">35 MM · CONTACT 01</span>
          <i className="login-film-clip" />
        </div>
        <img className="login-magnifier login-magnifier-left" src="/images/magnifying-glass.svg" alt="" width="160" height="205" draggable={false} />
        <img className="login-magnifier login-magnifier-right" src="/images/magnifying-glass.svg" alt="" width="160" height="205" draggable={false} />
        <div className="login-wanted-note">
          <i className="login-thread-pin" />
          <span className="login-wanted-kicker">Most</span>
          <h2>Wanted</h2>
          <p>Skills worth exchanging</p>
          <ul>
            <li>Math tutoring</li>
            <li>Bicycle repairs</li>
            <li>Guitar lessons</li>
            <li>Resume help</li>
          </ul>
          <small>Make your offer</small>
        </div>
        <div className="login-exchange-ticket">
          <img src="/images/exchange-ticket.svg" alt="" width="290" height="226" draggable={false} />
          <i className="login-thread-pin" />
        </div>
        <div className="login-board-note login-board-note-left">
          <i className="login-thread-pin" />
          <span>The exchange board</span>
          <p>Good at something?<br />Someone here<br />could use your help.</p>
          <small>Share a skill. Learn another.</small>
        </div>
        <div className="login-board-note login-board-note-right">
          <i className="login-thread-pin" />
          <span>A simple agreement</span>
          <p>Your know-how.<br />Their next step.</p>
          <small>That’s a fair exchange.</small>
        </div>
      </div>
      <div className="login-wrap">
        <a className="login-brand" href="/home"><i className="login-thread-pin" aria-hidden="true" />Barter Buddies<span>Skills shared. Possibilities opened.</span></a>
      <section className="login-panel" aria-labelledby="login-heading">
        <img className="login-map-fragment" src="/images/briefing-map.svg" alt="" aria-hidden="true" width="340" height="460" draggable={false} />
          <header className="login-header">
            <p className="login-eyebrow">Member access</p>
            <h1 id="login-heading">Access the network</h1>
            <p>Sign in to continue your next exchange.</p>
          </header>
          {signedIn ? (
            <div className="login-success">
              <p role="status">You’re signed in. Your next exchange awaits.</p>
              <a className="login-submit" href="/home">Continue to listings</a>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} aria-busy={pending}>
              {!auth.isConfigured && <p className="login-notice">{messages.unavailable}</p>}
              <div className="login-field">
                <label htmlFor="login-email">Email</label>
                <input ref={emailInput} id="login-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required
                  value={email} disabled={pending} placeholder="name@my.utsa.edu"
                  onChange={event => { setEmail(event.target.value); setError('') }}
                  onBlur={() => setTouched(current => ({ ...current, email: true }))}
                  aria-invalid={touched.email && Boolean(emailError)}
                  aria-describedby={touched.email && emailError ? 'login-email-error' : undefined} />
                {touched.email && emailError && <p className="login-field-error" id="login-email-error">{emailError}</p>}
              </div>
              <div className="login-field">
                <label htmlFor="login-password">Password</label>
                <div className="login-password">
                  <input ref={passwordInput} id="login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required
                    value={password} disabled={pending}
                    onChange={event => { setPassword(event.target.value); setError('') }}
                    onBlur={() => setTouched(current => ({ ...current, password: true }))}
                    aria-invalid={touched.password && Boolean(passwordError)}
                    aria-describedby={touched.password && passwordError ? 'login-password-error' : undefined} />
                  <button type="button" className="login-visibility" aria-label={visible ? 'Hide password' : 'Show password'} aria-controls="login-password" disabled={pending} onClick={() => setVisible(current => !current)}>{visible ? 'Hide' : 'Show'}</button>
                </div>
                {touched.password && passwordError && <p className="login-field-error" id="login-password-error">{passwordError}</p>}
              </div>
              <div role="alert" aria-atomic="true">{error && <p className="login-error">{error}</p>}</div>
              <button className="login-wax-seal" type="submit" disabled={pending}>
                <span>{pending ? 'Signing in…' : <>Enter<br />operation</>}</span>
              </button>
              <p className="login-signup">New to Barter Buddies?{' '}<a className="login-text-button" href="/add-details">Create an account</a></p>
            </form>
          )}
          <div role="status" aria-live="polite" aria-atomic="true">
            {pending && <p className="login-notice">Verifying your credentials…</p>}
          </div>
        </section>
        <footer className="login-footer"><span>The briefing room</span><a href="/home">Back to the community</a></footer>
      </div>
    </main>
  )
}
