import { useCallback, useEffect, useState } from 'react'
import { getFeed } from './lib/api'
import type { Listing } from './types'
import AddDetailsPage from './pages/AddDetailsPage'
import CreateListingPage from './pages/CreateListingPage'
import LoginPage from './pages/LoginPage'
import { auth } from './lib/auth'
import './pages/LoginPage.css'
import './home.css'
import HomeBoard from './pages/HomeBoard'
import BrowsePage from './pages/BrowsePage'
import ListingCard from './components/ListingCard'
import SkeletonCard from './components/SkeletonCard'
import EmptyState from './components/EmptyState'

function App() {
  // Start at member access; keep the community feed available at /home.
  const path = window.location.pathname.replace(/\/$/, '')

  if (!path || path === '/login') return <LoginPage />
  if (path === '/home') return <FeedPage />
  if (path === '/browse') return <BrowsePage />
  if (path === '/add-details') return <AddDetailsPage />
  if (path === '/create-listing') return <CreateListingPage />
  return <LoginPage />
}

type FeedState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; listings: Listing[] }

function FeedPage() {
  // One state value, so "loading" and "empty" can never be true at the same time.
  const [feed, setFeed] = useState<FeedState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setFeed({ status: 'loading' })
    getFeed()
      .then((listings) => {
        if (active) setFeed({ status: 'ready', listings })
      })
      .catch((error: Error) => {
        if (active) setFeed({ status: 'error', message: error.message || 'Could not load the board.' })
      })
    return () => {
      active = false
    }
  }, [attempt])

  return (
    <main className="home-page">
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
          <button type="button" onClick={() => {
            auth.signOut()
              .then(() => { window.location.assign('/login') })
              .catch((signOutError: Error) => console.error('SIGN OUT ERROR:', signOutError))
          }}>Sign out</button>
        </div>
      </nav>
      <HomeBoard />
      <section
        className="relative z-[1] mx-auto w-full max-w-[1100px] px-4 pb-16 sm:px-6"
        aria-labelledby="feed-heading"
        aria-busy={feed.status === 'loading'}
      >
        <header className="mb-5">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[.18em] text-[#7a263a]">The exchange board</p>
          <h2 id="feed-heading" className="m-0 mt-2 font-serif text-[26px] font-normal tracking-[-.03em] text-[#302c25]">
            Skills on offer right now
          </h2>
        </header>

        <div aria-live="polite">
          {feed.status === 'loading' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          )}

          {feed.status === 'error' && (
            <div
              role="alert"
              className="border border-[#d7c8ab] border-l-[3px] border-l-[#7a263a] bg-[#f0e8df] p-5 text-[#302c25]"
            >
              <p className="m-0 text-[13px]">{feed.message}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 border border-[#7a263a] bg-[#7a263a] px-4 py-2 text-[13px] font-semibold text-[#fffaf2] hover:bg-[#622033]"
              >
                Retry
              </button>
            </div>
          )}

          {feed.status === 'ready' && feed.listings.length === 0 && <EmptyState />}

          {feed.status === 'ready' && feed.listings.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feed.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
