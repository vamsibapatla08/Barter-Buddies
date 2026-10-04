import { useEffect } from 'react'
import { apiFetch } from './lib/api'
import AddDetailsPage from './pages/AddDetailsPage'
import CreateListingPage from './pages/CreateListingPage'
import LoginPage from './pages/LoginPage'
import { auth } from './lib/auth'
import './pages/LoginPage.css'
import './home.css'

function App() {
  // Start at member access; keep the community feed available at /home.
  const path = window.location.pathname.replace(/\/$/, '')

  useEffect(() => {
    apiFetch('/exchanges/mine')
      .then((data) => console.log('BACKEND TEST:', data))
      .catch((err) => console.error('BACKEND ERROR:', err))
  }, [])

  if (!path || path === '/login') return <LoginPage />
  if (path === '/home') return <FeedPage />
  if (path === '/add-details') return <AddDetailsPage />
  if (path === '/create-listing') return <CreateListingPage />
  return <LoginPage />
}

function FeedPage() {
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

    </main>
  )
}

export default App
