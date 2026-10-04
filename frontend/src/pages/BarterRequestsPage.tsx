import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getMyExchanges, respondToExchange } from '../lib/api'
import type { ExchangeSummary, LedgerOut, RespondAction } from '../types'
import { auth } from '../lib/auth'
import '../pages/LoginPage.css'
import '../home.css'
import './BarterRequestsPage.css'

const STATUS_LABELS: Record<string, string> = {
  proposed: 'Awaiting a reply',
  accepted: 'Accepted',
  locked: 'Terms locked',
  completed: 'Completed',
  declined: 'Declined',
}

type LedgerState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ledger: LedgerOut }

export default function BarterRequestsPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [state, setState] = useState<LedgerState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [signOutError, setSignOutError] = useState('')

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
    root.querySelectorAll('.home-nav, .login-brand, .login-board-note, .login-exchange-ticket, .login-wanted-note').forEach(node => observer.observe(node))
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const reload = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    getMyExchanges()
      .then(ledger => {
        if (active) setState({ status: 'ready', ledger })
      })
      .catch((error: Error) => {
        if (active) setState({ status: 'error', message: error.message || 'Could not load your barter requests.' })
      })
    return () => {
      active = false
    }
  }, [attempt])

  async function respond(id: string, action: RespondAction) {
    setBusy(current => ({ ...current, [id]: true }))
    setRowError(current => ({ ...current, [id]: '' }))
    try {
      await respondToExchange(id, action)
      reload()
    } catch (error) {
      setRowError(current => ({ ...current, [id]: (error as Error).message || 'That did not go through.' }))
    } finally {
      setBusy(current => ({ ...current, [id]: false }))
    }
  }

  function card(item: ExchangeSummary, incoming: boolean) {
    return (
      <article key={item.id} className="request-card">
        <i className="request-pin" aria-hidden="true" />
        <span className="request-status">{STATUS_LABELS[item.status] ?? item.status}</span>
        <h3>{item.summary.trim().toLowerCase() === 'bio' ? 'Biology' : item.summary}</h3>
        <p>
          {incoming ? 'Proposed by' : 'Sent to'} {item.other.name}
          {item.other.file_code ? ` · ${item.other.file_code}` : ''}
        </p>
        {rowError[item.id] && <p className="request-notice request-notice-bad" role="alert">{rowError[item.id]}</p>}
        {incoming && item.status === 'proposed' && (
          <div className="request-actions">
            <button type="button" className="request-button" disabled={busy[item.id]}
              onClick={() => respond(item.id, 'accept')}>
              {busy[item.id] ? 'Working…' : 'Accept'}
            </button>
            <button type="button" className="request-button request-button-quiet" disabled={busy[item.id]}
              onClick={() => respond(item.id, 'decline')}>
              Decline
            </button>
          </div>
        )}
      </article>
    )
  }

  function group(title: string, note: string, items: ExchangeSummary[], incoming: boolean) {
    return (
      <section className="request-group" aria-labelledby={`group-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <h2 id={`group-${title.replace(/\s+/g, '-').toLowerCase()}`} className="request-group-heading">
          {title} <small>{items.length}</small>
        </h2>
        {items.length ? (
          <div className="request-list">{items.map(item => card(item, incoming))}</div>
        ) : (
          <p className={`request-empty${title === 'Needs your answer' || title === 'You proposed' || title === 'Closed' ? ' request-empty-card' : ''}`}>{note}</p>
        )}
      </section>
    )
  }

  const ledger = state.status === 'ready' ? state.ledger : null

  return (
    <main className="home-page requests-page" ref={board}>
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
      <nav className="home-nav">
        <a className="login-brand home-brand" href="/home">
          <i className="login-thread-pin" aria-hidden="true" />
          Barter Buddies
          <span>Skills shared. Possibilities opened.</span>
        </a>
        <div className="home-toolbar">
          <button type="button" className="home-requests" onClick={() => window.location.assign('/barter-requests')}>Barter Request</button>
          <div className="home-account">
            <img src="/images/member-avatar.jpg" alt="Your profile avatar" />
            <button type="button" onClick={() => {
              auth.signOut()
                .then(() => window.location.assign('/login'))
                .catch(() => setSignOutError('Could not sign out.'))
            }}>Sign out</button>
          </div>
        </div>
      </nav>
      <div className="requests-decoration-wrap" aria-hidden="true">
        <img className="login-map-fragment" src="/images/briefing-map.svg" alt="" width="340" height="460" draggable={false} />
      </div>
      <a className="requests-back" href="/home">← Back to home</a>

      <section className="requests-content" aria-label="Your barter requests">
        <header className="requests-header">
          <span className="requests-kicker">The exchange ledger</span>
          <h1>Barter requests</h1>
          <p className="requests-header-copy">Every trade you proposed, and every one proposed to you.</p>
        </header>

        <div role="alert" aria-atomic="true">
          {signOutError && <p className="request-notice request-notice-bad">{signOutError}</p>}
        </div>

        <div aria-live="polite" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && <p className="request-empty">Gathering your requests…</p>}

          {state.status === 'error' && (
            <div className="request-notice request-notice-bad" role="alert">
              <p>{state.message}</p>
              <button type="button" className="request-button" onClick={reload}>Retry</button>
            </div>
          )}

          {ledger && (
            <>
              {group('Needs your answer', 'Nothing waiting on you right now.', ledger.incoming, true)}
              {group('You proposed', 'You have not proposed a trade yet. Find one on the board.', ledger.pending, false)}
              {group('In progress', 'No trades under way.', ledger.active, false)}
              {group('Closed', 'Nothing closed yet.', ledger.closed, false)}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
