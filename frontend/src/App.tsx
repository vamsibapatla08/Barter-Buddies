import { useEffect, useState } from 'react'
import { getFeed } from './lib/api'
import type { Listing } from './types'
import AddDetailsPage from './pages/AddDetailsPage'
import CreateListingPage from './pages/CreateListingPage'
import LoginPage from './pages/LoginPage'

function App() {
  // Start at member access; keep the community feed available at /home.
  const path = window.location.pathname.replace(/\/$/, '')
  if (!path || path === '/login') return <LoginPage />
  if (path === '/home') return <FeedPage />
  if (path === '/add-details') return <AddDetailsPage />
  if (path === '/create-listing') return <CreateListingPage />
  return <LoginPage />
}

function FeedPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getFeed()
      .then(setListings)
      .catch((requestError: Error) => setError(requestError.message))
  }, [])

  return (
    <main className="app-shell">
      <nav className="nav">
        <a className="brand" href="/home">
          Barter Buddies
        </a>
        <a className="button button-secondary" href="/login">
          Sign in
        </a>
      </nav>

      <section className="hero">
        <p className="eyebrow">Trade what you know</p>
        <h1>Find a buddy. Learn something new.</h1>
        <p className="hero-copy">
          Share your skills, discover useful ones, and make exchanges that work
          for both of you.
        </p>
        <button className="button button-primary" type="button">
          Browse listings
        </button>
      </section>

      <section className="listings-section" aria-labelledby="listings-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community board</p>
            <h2 id="listings-heading">Latest listings</h2>
          </div>
        </div>

        {error ? (
          <p className="message" role="alert">
            {error}
          </p>
        ) : listings.length > 0 ? (
          <div className="listing-grid">
            {listings.map((listing) => (
              <article className="listing-card" key={listing.id}>
                <span className="tag">{listing.category}</span>
                <h3>{listing.title}</h3>
                <p>{listing.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="message">No listings yet. Be the first to share a skill.</p>
        )}
      </section>
    </main>
  )
}

export default App
