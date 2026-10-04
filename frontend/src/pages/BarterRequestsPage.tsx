import { useCallback, useEffect, useState } from 'react'
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
  const [state, setState] = useState<LedgerState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [signOutError, setSignOutError] = useState('')

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
          <p className={`request-empty${title === 'Needs your answer' || title === 'Closed' ? ' request-empty-card' : ''}`}>{note}</p>
        )}
      </section>
    )
  }

  const ledger = state.status === 'ready' ? state.ledger : null

  return (
    <main className="home-page requests-page">
      <div className="login-board-notes" aria-hidden="true">
        <img className="login-magnifier login-magnifier-left" src="/images/magnifying-glass.svg" alt="" width="160" height="205" draggable={false} />
        <img className="login-magnifier login-magnifier-right" src="/images/magnifying-glass.svg" alt="" width="160" height="205" draggable={false} />
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
