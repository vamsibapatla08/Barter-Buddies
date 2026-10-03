import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './LoginPage.css'
import './AddDetailsPage.css'

export default function AddDetailsPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordError('')
    setSubmitted(true)
  }

  return (
    <main className="login-page details-page" ref={board}>
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
      <div className="login-wrap details-wrap">
        <a className="login-brand details-brand" href="/">
          <i className="login-thread-pin" aria-hidden="true" />
          Barter Buddies
          <span>Skills shared. Possibilities opened.</span>
        </a>
        <section className="login-panel details-panel" aria-labelledby="details-heading">
          <img className="login-map-fragment" src="/images/briefing-map.svg" alt="" aria-hidden="true" width="340" height="460" draggable={false} />
          <header className="login-header">
            <p className="login-eyebrow">New member file</p>
            <h1 id="details-heading">Add your details</h1>
            <p className="details-intro">
            Tell the crew a little about yourself before you enter the network.
            </p>
          </header>

          {submitted ? (
            <div className="details-notice" role="status">
              Your details are ready for the next step.
              <a href="/login">Continue to sign in</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="login-field details-field">
                <label htmlFor="details-name">Your name</label>
                <input id="details-name" name="name" type="text" autoComplete="name" required />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-email">Email address</label>
                <input id="details-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-password">Create a new password</label>
                <input
                  id="details-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value)
                    setPasswordError('')
                  }}
                />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-confirm-password">Confirm your password</label>
                <input
                  id="details-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={event => {
                    setConfirmPassword(event.target.value)
                    setPasswordError('')
                  }}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'details-password-error' : undefined}
                />
                {passwordError && (
                  <p className="login-field-error" id="details-password-error">
                    {passwordError}
                  </p>
                )}
              </div>
              <button className="details-submit" type="submit">
                Continue
              </button>
            </form>
          )}
          <p className="login-signup details-back">
            Already have an account? <a href="/login">Return to sign in</a>
          </p>
        </section>
        <footer className="login-footer">
          <span>The briefing room</span>
          <a href="/">Back to the community</a>
        </footer>
      </div>
    </main>
  )
}
