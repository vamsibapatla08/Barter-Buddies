import { useEffect, useRef, useState } from 'react'
import { getFeed, getMatches } from '../lib/api'
import type { Listing, Match } from '../types'

type BoardView = 'browse' | 'recommend'

function Blueprint({ circular = false }: { circular?: boolean }) {
  return <svg viewBox="0 0 260 220" fill="none" aria-hidden="true" className="board-blueprint">
    <defs><pattern id={circular ? 'publish-grid' : 'browse-grid'} width="13" height="13" patternUnits="userSpaceOnUse"><path d="M13 0H0V13" stroke="currentColor" strokeWidth=".4" opacity=".3" /></pattern></defs>
    <path fill={`url(#${circular ? 'publish-grid' : 'browse-grid'})`} d="M0 0h260v220H0z" />
    <g stroke="currentColor" strokeWidth="1.3">
      <path d="M14 14h232v192H14zM21 21h218v178H21z" />
      {circular ? <><circle cx="125" cy="103" r="65" /><circle cx="125" cy="103" r="52" /><circle cx="125" cy="103" r="24" /><path d="M45 103h160M125 27v151M78 57l94 94M78 150l94-94M113 39v40m24-40v40M61 91h40m-40 24h40M151 91h40m-40 24h40" /></> : <><path d="M45 43h165v127H45zM50 48h155v117H50zM113 48v38m0 26v53M50 96h34m25 0h96M152 48v48M152 128v37M50 132h63" /><path d="M84 96V71a25 25 0 0 1 25 25M113 112h26a26 26 0 0 0-26-26" strokeWidth=".8" /><circle cx="169" cy="128" r="23" /><circle cx="169" cy="128" r="17" /><path d="M169 100v56m-28-28h56M157 116l24 24m0-24-24 24M58 56h20v22H58z" /></>}
      <path d="M32 183h97m-97-4v8m97-8v8M179 181h48v11h-48z" strokeWidth=".6" />
    </g>
    <g fill="currentColor" fontFamily="monospace" fontSize="5" letterSpacing="1"><text x="33" y="33">B.B. / EXCHANGE DIVISION</text><text x="33" y="195">FIELD NOTES — 001</text><text x="183" y="188">SCALE 1:100</text></g>
  </svg>
}

function CardArt({ kind }: { kind: 'browse' | 'recommend' | 'publish' }) {
  return <span className={`board-art board-art-${kind}`} aria-hidden="true">
    {kind === 'browse' && <><span className="blueprint-sheet"><Blueprint /></span><span className="asset-label">TARGETS &amp; ASSETS</span><span className="browse-spyglass" aria-hidden="true"><i className="spyglass-hood" /><i className="spyglass-body" /><i className="spyglass-ring" /><i className="spyglass-focus" /><i className="spyglass-knurl" /><i className="spyglass-eyepiece" /><i className="spyglass-glint" /></span><span className="spyglass-pin" aria-hidden="true" /><span className="camera-lens" aria-hidden="true"><i /></span><span className="paper-coordinate">41° 52′ N · 87° 37′ W</span></>}
    {kind === 'recommend' && <><span className="dossier-back" /><span className="dossier-paper"><span className="dossier-heading">COMMUNITY INTELLIGENCE</span><span className="dossier-portrait"><svg viewBox="0 0 80 90"><circle cx="40" cy="28" r="17" /><path d="M9 88V74c0-27 62-27 62 0v14z" /></svg></span><span className="dossier-lines" /><span className="dossier-stamp">GOOD MATCH</span></span><span className="dossier-front"><span>THE RIGHT CONNECTION</span><b>Better together.</b><i>Skills to share. People to know.</i></span><span className="board-paperclip" /></>}
    {kind === 'publish' && <><span className="publish-plan"><Blueprint circular /></span><span className="publish-note"><span>YOUR NEXT EXCHANGE</span><b>A little know-how.<br />A new possibility.</b><i /><i /><i /><span className="publish-signature">Make it happen.</span></span><span className="board-pencil" /><span className="board-stamp">READY TO SHARE</span></>}
  </span>
}

export default function HomeBoard() {
  const [view, setView] = useState<BoardView | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const results = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!view) return
    let active = true
    setLoading(true)
    setError(false)
    results.current?.focus({ preventScroll: true })
    results.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    const request = view === 'browse' ? getFeed().then(data => { if (active) setListings(data) }) : getMatches().then(data => { if (active) setMatches(data) })
    request.catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [view, attempt])

  const filtered = listings.filter(item => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="home-board">
    <header className="board-intro"><span className="board-kicker">THE COMMUNITY EXCHANGE · EST. 2026</span><h1>Crew debrief</h1><p>Good skills. Good people. Great exchanges.</p></header>
    <div className="board-actions" aria-label="Choose your next step">
      <a className="action-card action-browse" href="/browse"><i className="board-pin" /><span className="card-index">01 / EXPLORE</span><h2>Browse</h2><CardArt kind="browse" /><span className="card-caption"><strong>Find your next trade.</strong><span>Discover skills & goods from the crew.</span></span><span className="card-link">Explore the board <span>↗</span></span></a>
      <button className="action-card action-recommend" type="button" aria-expanded={view === 'recommend'} aria-controls={view === 'recommend' ? 'board-results' : undefined} onClick={() => setView('recommend')}><i className="board-pin" /><span className="card-index">02 / CONNECT</span><h2>Recommend</h2><CardArt kind="recommend" /><span className="card-caption"><strong>Meet your kind of crew.</strong><span>Find people whose skills fit yours.</span></span><span className="card-link">See your matches <span>↗</span></span></button>
      <a className="action-card action-publish" href="/create-listing"><i className="board-pin" /><span className="card-index">03 / CONTRIBUTE</span><h2>Publish</h2><CardArt kind="publish" /><span className="card-caption"><strong>Put your skills to work.</strong><span>Offer what you know. Ask for what you need.</span></span><span className="card-link">Create a listing <span>↗</span></span><span className="crew-id-card" aria-hidden="true"><span className="crew-id-header"><svg className="crew-id-avatar" viewBox="0 0 48 48"><circle cx="24" cy="24" r="23" fill="#9b9d99" /><circle cx="24" cy="17" r="8" fill="#555a59" /><path d="M8 43c1-10 6-15 16-15s15 5 16 15" fill="#555a59" /></svg><span className="crew-id-title"><b>BARTER BUDDIES</b><small>CREW ACCESS CARD</small></span></span><span className="crew-id-band">UNIVERSITY OF TEXAS SAN ANTONIO</span><span className="crew-id-details"><b>ANONYMOUS MEMBER</b><small>CREW ID · BB 001</small></span></span></a>
    </div>
    <div className="board-footnote"><span>NO MONEY. JUST POSSIBILITY.</span><p>Everyone has something worth sharing.</p><span>YOUR NEXT MOVE ↑</span></div>
    {view && <section id="board-results" className="board-results" ref={results} tabIndex={-1} aria-labelledby="results-title" aria-busy={loading}>
      <div className="results-heading"><div><span className="board-kicker">{view === 'browse' ? 'THE EXCHANGE BOARD' : 'COMMUNITY INTELLIGENCE'}</span><h2 id="results-title">{view === 'browse' ? 'Skills worth discovering.' : 'Your recommended crew.'}</h2></div><button type="button" onClick={() => { setView(null); document.querySelector<HTMLButtonElement>(`.action-${view}`)?.focus() }}>Close <span aria-hidden="true">×</span></button></div>
      {view === 'browse' && <label className="board-search">Search skills & goods<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try guitar lessons, bicycle repairs…" /></label>}
      <div aria-live="polite">{loading ? <p className="results-notice">Gathering your {view === 'browse' ? 'listings' : 'matches'}…</p> : error ? <div className="results-notice"><p>We couldn’t load your {view === 'browse' ? 'listings' : 'matches'}. Check your connection and make sure you’re signed in.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : view === 'browse' ? <div className="results-grid">{filtered.length ? filtered.map(item => <article key={item.id}><span className="board-kicker">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p>{item.owner && <small>Offered by {item.owner.name}</small>}</article>) : <p className="results-notice">{query ? 'No listings match that search. Try another skill.' : 'The board is waiting for its next great offer. Share yours to get things started.'}</p>}</div> : <div className="results-grid">{matches.length ? matches.map(item => <article key={item.user_id}><span className="board-kicker">{item.mutual ? 'MUTUAL MATCH' : 'SKILL CONNECTION'}</span><h3>{item.name}</h3>{item.they_give && <p>They offer: {item.they_give.label}</p>}{item.you_give && <p>You offer: {item.you_give.label}</p>}</article>) : <p className="results-notice">No matches yet. Add your skills and interests in <a href="/add-details">your profile</a> to help the right people find you.</p>}</div>}</div>
    </section>}
  </div>
}
