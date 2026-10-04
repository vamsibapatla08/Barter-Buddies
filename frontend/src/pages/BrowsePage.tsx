import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getFeed, getListing, getSessionUserId, proposeExchange } from '../lib/api'
import { clearMyListingId, getMyListingId } from '../lib/myListing'
import type { Listing, ListingDetail } from '../types'
import { auth } from '../lib/auth'
import '../pages/LoginPage.css'
import '../home.css'
import './BrowsePage.css'

const MODE_LABELS: Record<string, string> = { in_person: 'In person', online: 'Online' }

function modeLabel(mode: string | null): string {
  return mode ? MODE_LABELS[mode] ?? mode : 'Mode to be arranged'
}

/** POST /exchanges needs a non-empty when/where even when the listing left them blank. */
function termsFrom(listing: Listing) {
  const online = listing.mode === 'online'
  return {
    when: listing.available_when || 'To be arranged',
    where: listing.meet_spot || (online ? 'Online' : 'To be arranged'),
    mode: listing.mode === 'in_person' || listing.mode === 'online' ? listing.mode : 'in_person',
  }
}

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; listings: Listing[] }

/** Where each card is in the propose flow. */
type ProposeState =
  | { stage: 'idle' }
  | { stage: 'open'; note: string }
  | { stage: 'sending' }
  | { stage: 'sent'; withWhom: string }
  | { stage: 'failed'; note: string; message: string }

export default function BrowsePage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [feed, setFeed] = useState<FeedState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [signOutError, setSignOutError] = useState('')

  // The listing you published. /feed hides your own rows, so fetch it by id.
  // It is only usable once the API confirms you still own it.
  const [mine, setMine] = useState<ListingDetail | null>(null)
  const [mineError, setMineError] = useState('')
  const [lookingUpMine, setLookingUpMine] = useState(true)

  const [propose, setPropose] = useState<Record<string, ProposeState>>({})

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

  const stateFor = (id: string): ProposeState => propose[id] ?? { stage: 'idle' }
  const setStateFor = (id: string, next: ProposeState) =>
    setPropose(current => ({ ...current, [id]: next }))

  const retry = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    let active = true
    setFeed({ status: 'loading' })
    getFeed()
      .then(listings => {
        if (active) setFeed({ status: 'ready', listings })
      })
      .catch((error: Error) => {
        if (active) setFeed({ status: 'error', message: error.message || 'Could not load the board.' })
      })
    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    let active = true
    setLookingUpMine(true)
    ;(async () => {
      try {
        const userId = await getSessionUserId()
        const storedId = getMyListingId(userId)
        if (!storedId || !userId) return
        const listing = await getListing(storedId)
        // A listing published by another account on this browser, or one that
        // has since been removed, must never be offered as yours: the backend
        // answers 400 "requester_listing_id must be your active offer".
        if (listing.owner?.id !== userId) {
          clearMyListingId()
          return
        }
        if (active) setMine(listing)
      } catch (error) {
        // 404 means it was deleted or deactivated; stop offering it.
        clearMyListingId()
        if (active) setMineError((error as Error).message || 'Could not load your listing.')
      } finally {
        if (active) setLookingUpMine(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function sendProposal(listing: Listing, note: string) {
    if (!mine) return
    setStateFor(listing.id, { stage: 'sending' })
    const terms = termsFrom(listing)
    try {
      await proposeExchange({
        recipient_id: listing.owner.id,
        requester_listing_id: mine.id,
        recipient_listing_id: listing.id,
        terms: {
          requester_gives: mine.title,
          recipient_gives: listing.title,
          when: terms.when,
          where: terms.where,
          mode: terms.mode,
          note: note.trim() || null,
        },
        source: 'browse',
      })
      setStateFor(listing.id, { stage: 'sent', withWhom: listing.owner.name })
    } catch (error) {
      const raw = (error as Error).message || 'Could not send that proposal.'
      // The stored listing is no longer a valid offer for this account; drop it
      // so the page stops proposing it and asks for a new one instead.
      const stale = raw.includes('requester_listing_id')
      if (stale) {
        clearMyListingId()
        setMine(null)
      }
      setStateFor(listing.id, {
        stage: 'failed',
        note,
        message: stale
          ? 'The listing you were offering is not yours any more. Publish a new one to propose a trade.'
          : raw,
      })
    }
  }

  const listings = feed.status === 'ready' ? feed.listings : []
  const filtered = listings.filter(listing =>
    `${listing.title} ${listing.detail ?? ''} ${listing.skill_label} ${listing.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <main className="home-page browse-page" ref={board}>
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
      <div className="browse-decoration-wrap" aria-hidden="true">
        <img className="login-map-fragment" src="/images/briefing-map.svg" alt="" width="340" height="460" draggable={false} />
      </div>
      <a className="browse-back browse-back-top" href="/home">← Back to home</a>
      <section className="browse-content" aria-label="Search the exchange board">
        <div role="alert" aria-atomic="true">
          {signOutError && <p className="browse-notice browse-notice-bad">{signOutError}</p>}
        </div>

        {(mine || mineError) && (
          <section className="browse-mine" aria-labelledby="browse-mine-heading">
            <span className="browse-kicker">Just published</span>
            <h2 id="browse-mine-heading" className="browse-mine-heading">Your listing is on the board</h2>
            {mine ? (
              <article className="browse-card browse-card-mine">
                <i className="browse-pin" aria-hidden="true" />
                <span>{mine.category}</span>
                <h3>{mine.title}</h3>
                {mine.description && <p>{mine.description}</p>}
                <dl className="browse-coordinates">
                  <div><dt>When</dt><dd>{mine.available_when || 'To be arranged'}</dd></div>
                  <div><dt>Where</dt><dd>{mine.meet_spot || (mine.mode === 'online' ? 'Online' : 'To be arranged')}</dd></div>
                  <div><dt>Mode</dt><dd>{modeLabel(mine.mode)}</dd></div>
                </dl>
                <small>This is what you are offering in a trade.</small>
              </article>
            ) : (
              <p className="browse-notice browse-notice-bad">{mineError}</p>
            )}
          </section>
        )}

        <label className="browse-search">
          <span>Search by skill</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search for a skill…" autoFocus />
        </label>

        {!mine && !lookingUpMine && (
          <p className="browse-notice">
            Publish a listing of your own before proposing a trade.{' '}
            <a href="/create-listing">Publish a barter →</a>
          </p>
        )}

        <div className="browse-results" aria-live="polite" aria-busy={feed.status === 'loading'}>
          {feed.status === 'loading' && <p className="browse-message">Gathering the board…</p>}

          {feed.status === 'error' && (
            <div className="browse-notice browse-notice-bad" role="alert">
              <p>{feed.message}</p>
              <button type="button" className="browse-button" onClick={retry}>Retry</button>
            </div>
          )}

          {feed.status === 'ready' && filtered.length === 0 && (
            <p className="browse-message">
              {query ? 'No skills match that search yet.' : 'Nothing on the board yet. Yours could be the first.'}
            </p>
          )}

          {filtered.map(listing => {
            const state = stateFor(listing.id)
            const terms = termsFrom(listing)
            return (
              <article key={listing.id} className="browse-card">
                <i className="browse-pin" aria-hidden="true" />
                <span>{listing.skill_label} · {listing.category}</span>
                <h2>{listing.title}</h2>
                {listing.detail && <p>{listing.detail}</p>}
                <dl className="browse-coordinates">
                  <div><dt>When</dt><dd>{terms.when}</dd></div>
                  <div><dt>Where</dt><dd>{terms.where}</dd></div>
                  <div><dt>Mode</dt><dd>{modeLabel(listing.mode)}</dd></div>
                </dl>
                <small>Offered by {listing.owner.name}</small>

                {state.stage === 'sent' ? (
                  <p className="browse-notice browse-notice-good" role="status">
                    Proposal sent. Waiting for {state.withWhom} to respond.
                  </p>
                ) : state.stage === 'idle' ? (
                  <button
                    type="button"
                    className="browse-button browse-propose"
                    disabled={!mine}
                    title={mine ? undefined : 'Publish a listing of your own first'}
                    onClick={() => setStateFor(listing.id, { stage: 'open', note: '' })}
                  >
                    Propose trade
                  </button>
                ) : (
                  <div className="browse-proposal">
                    <p className="browse-proposal-summary">
                      You give <strong>{mine?.title}</strong>. They give <strong>{listing.title}</strong>.
                      <br />
                      {terms.when} · {terms.where} · {modeLabel(terms.mode)}
                    </p>
                    <label className="browse-proposal-note">
                      <span>Add a note (optional)</span>
                      <textarea
                        rows={2}
                        value={state.stage === 'sending' ? '' : state.note}
                        disabled={state.stage === 'sending'}
                        placeholder="Anything they should know?"
                        onChange={event => setStateFor(listing.id, { stage: 'open', note: event.target.value })}
                      />
                    </label>
                    {state.stage === 'failed' && (
                      <p className="browse-notice browse-notice-bad" role="alert">{state.message}</p>
                    )}
                    <div className="browse-proposal-actions">
                      <button
                        type="button"
                        className="browse-button"
                        disabled={state.stage === 'sending'}
                        onClick={() => sendProposal(listing, state.stage === 'sending' ? '' : state.note)}
                      >
                        {state.stage === 'sending' ? 'Sending…' : 'Send proposal'}
                      </button>
                      <button
                        type="button"
                        className="browse-button browse-button-quiet"
                        disabled={state.stage === 'sending'}
                        onClick={() => setStateFor(listing.id, { stage: 'idle' })}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
