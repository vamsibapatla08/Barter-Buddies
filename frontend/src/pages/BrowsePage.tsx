import { useEffect, useState } from 'react'
import { getFeed } from '../lib/api'
import type { Listing } from '../types'
import { auth } from '../lib/auth'
import '../pages/LoginPage.css'
import '../home.css'
import './BrowsePage.css'

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getFeed()
      .then(setListings)
      .catch(() => setListings([]))
  }, [])

  const filtered = listings.filter(listing =>
    `${listing.title} ${listing.description} ${listing.category}`.toLowerCase().includes(query.toLowerCase()),
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
          <button type="button" onClick={() => auth.signOut().then(() => window.location.assign('/login')).catch(() => setError('Could not sign out.'))}>Sign out</button>
        </div>
      </nav>
      <a className="browse-back browse-back-top" href="/home">← Back to home</a>
      <section className="browse-content" aria-label="Search the exchange board">
        <label className="browse-search">
          <span>Search by skill</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search for a skill…" autoFocus />
        </label>
        <div className="browse-results" aria-live="polite">
          {filtered.length ? filtered.map(listing => (
            <article key={listing.id}>
              <span>{listing.category}</span>
              <h2>{listing.title}</h2>
              <p>{listing.description}</p>
              {listing.owner && <small>Offered by {listing.owner.name}</small>}
            </article>
          )) : query ? <p className="browse-message">No skills match that search yet.</p> : null}
        </div>
      </section>
    </main>
  )
}
