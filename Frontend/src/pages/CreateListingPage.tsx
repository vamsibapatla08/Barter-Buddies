import { useLayoutEffect, useRef, useState } from 'react'
import './LoginPage.css'
import './CreateListingPage.css'

export default function CreateListingPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])

  useLayoutEffect(() => {
    const root = board.current
    if (!root) return
    const update = () => {
      const origin = root.getBoundingClientRect()
      const pinPosition = (selector: string) => {
        const pin = root.querySelector<HTMLElement>(selector)
        if (!pin?.getClientRects().length) return null
        const rect = pin.getBoundingClientRect()
        return { x: rect.left + rect.width / 2 - origin.left + root.scrollLeft, y: rect.top + rect.height / 2 - origin.top + root.scrollTop }
      }
      const top = pinPosition('.login-brand .login-thread-pin')
      const left = pinPosition('.login-board-note-left .login-thread-pin')
      const right = pinPosition('.login-board-note-right .login-thread-pin')
      const ticket = pinPosition('.login-exchange-ticket .login-thread-pin')
      const wanted = pinPosition('.login-wanted-note .login-thread-pin')
      if (!top || !left || !right) return setThreads([])
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
    root.querySelectorAll('.login-brand, .login-board-note, .login-exchange-ticket').forEach(node => observer.observe(node))
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <main className="login-page listing-page" ref={board}>
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
        <div className="login-filmstrip"><div className="login-film-frame"><img src="/images/doorway-contact.png" alt="" /></div><div className="login-film-detail"><img src="/images/doorway-contact.png" alt="" /></div><span className="login-film-reference">35 MM · CONTACT 01</span><i className="login-film-clip" /></div>
        <img className="login-magnifier login-magnifier-left" src="/images/magnifying-glass.svg" alt="" />
        <img className="login-magnifier login-magnifier-right" src="/images/magnifying-glass.svg" alt="" />
        <div className="login-wanted-note"><i className="login-thread-pin" /><span className="login-wanted-kicker">Most</span><h2>Wanted</h2><p>Skills worth exchanging</p><ul><li>Math tutoring</li><li>Bicycle repairs</li><li>Guitar lessons</li><li>Resume help</li></ul><small>Make your offer</small></div>
        <div className="login-exchange-ticket"><img src="/images/exchange-ticket.svg" alt="" /><i className="login-thread-pin" /></div>
        <div className="login-board-note login-board-note-left"><i className="login-thread-pin" /><span>The exchange board</span><p>Good at something?<br />Someone here<br />could use your help.</p><small>Share a skill. Learn another.</small></div>
        <div className="login-board-note login-board-note-right"><i className="login-thread-pin" /><span>A simple agreement</span><p>Your know-how.<br />Their next step.</p><small>That’s a fair exchange.</small></div>
      </div>
      <div className="login-wrap listing-wrap">
        <a className="login-brand listing-brand" href="/"><i className="login-thread-pin" aria-hidden="true" />Barter Buddies<span>Skills shared. Possibilities opened.</span></a>
        <img className="login-map-fragment listing-map" src="/images/briefing-map.svg" alt="" aria-hidden="true" />
        <section className="login-panel listing-panel" aria-labelledby="listing-heading" onScroll={event => {
          const offset = Math.min(event.currentTarget.scrollTop * 0.12, 48)
          board.current?.style.setProperty('--listing-scroll-offset', `${offset}px`)
        }}>
          <header className="login-header">
            <h1 id="listing-heading">Publish a Barter</h1>
            <p className="listing-intro">Start a listing and give the crew the coordinates for a fair exchange.</p>
          </header>
          <form onSubmit={event => event.preventDefault()}>
            <fieldset className="listing-box">
              <legend>Listing</legend>
              <label htmlFor="listing-title">Start a listing</label>
              <input id="listing-title" name="title" type="text" placeholder="What can you teach or help with?" required />
            </fieldset>
            <fieldset className="listing-box">
              <legend>Offer</legend>
              <label htmlFor="listing-offer">What are you offering?</label>
              <input id="listing-offer" name="offer" type="text" placeholder="Your skill, time, or know-how" required />
            </fieldset>
            <fieldset className="listing-box">
              <legend>Counter Ask</legend>
              <label htmlFor="listing-ask">What would make this a fair exchange?</label>
              <input id="listing-ask" name="ask" type="text" placeholder="What would you like in return?" required />
            </fieldset>
            <fieldset className="listing-box listing-coordinates">
              <legend>Coordinates</legend>
              <div><label htmlFor="listing-date">Date</label><select id="listing-date" name="date" defaultValue=""><option value="" disabled>Select date</option><option>Today</option><option>Tomorrow</option><option>This weekend</option></select></div>
              <div><label htmlFor="listing-time">Time</label><select id="listing-time" name="time" defaultValue=""><option value="" disabled>Select time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>
              <div><label htmlFor="listing-place">Place</label><input id="listing-place" name="place" type="text" placeholder="Enter a meetup place" required /></div>
            </fieldset>
            <fieldset className="listing-box listing-validate">
              <legend>Validate Listing</legend>
              <label><input type="checkbox" required /> Confirmed the barter details.</label>
            </fieldset>
            <div className="listing-actions">
              <button className="details-submit listing-publish" type="submit">Publish</button>
              <a className="listing-skip" href="/" aria-label="Skip creating a listing and return to the community">Skip</a>
            </div>
          </form>
        </section>
        <footer className="login-footer"><span>The briefing room</span><a href="/">Back to the community</a></footer>
      </div>
    </main>
  )
}
