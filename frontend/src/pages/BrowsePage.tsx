import { useCallback, useEffect, useState } from 'react'
import { getFeed, getListing, proposeExchange } from '../lib/api'
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
  const [feed, setFeed] = useState<FeedState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [signOutError, setSignOutError] = useState('')

  // The listing you just published. /feed hides your own rows, so fetch it by id.
  const [myListingId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('myListingId')
    } catch {
      return null
    }
  })
  const [mine, setMine] = useState<ListingDetail | null>(null)
  const [mineError, setMineError] = useState('')

  const [propose, setPropose] = useState<Record<string, ProposeState>>({})

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
    if (!myListingId) return
    let active = true
    getListing(myListingId)
      .then(listing => {
        if (active) setMine(listing)
      })
      .catch((error: Error) => {
        if (active) setMineError(error.message || 'Could not load your listing.')
      })
    return () => {
      active = false
    }
  }, [myListingId])

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
      setStateFor(listing.id, {
        stage: 'failed',
        note,
        message: (error as Error).message || 'Could not send that proposal.',
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
    <main className="home-page browse-page">
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
        <div className="home-account">
          <img src="/images/member-avatar.jpg" alt="Your profile avatar" />
<<<<<<< HEAD
          <button type="button" onClick={() => auth.signOut().then(() => window.location.assign('/login')).catch(() => undefined)}>Sign out</button>
=======
          <button type="button" onClick={() => {
            auth.signOut()
              .then(() => window.location.assign('/login'))
              .catch(() => setSignOutError('Could not sign out.'))
          }}>Sign out</button>
>>>>>>> 974a9bf4a654a8456a2f67f9c2ea14f8b606ad07
        </div>
      </nav>
      <a className="browse-back browse-back-top" href="/home">← Back to home</a>
      <section className="browse-content" aria-label="Search the exchange board">
        <div role="alert" aria-atomic="true">
          {signOutError && <p className="browse-notice browse-notice-bad">{signOutError}</p>}
        </div>

        {myListingId && (
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
            ) : mineError ? (
              <p className="browse-notice browse-notice-bad">{mineError}</p>
            ) : (
              <p className="browse-notice">Loading your listing…</p>
            )}
          </section>
        )}

        <label className="browse-search">
          <span>Search by skill</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search for a skill…" autoFocus />
        </label>

        {!myListingId && (
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
