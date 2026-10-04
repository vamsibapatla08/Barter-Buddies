import { useLayoutEffect, useState, useRef } from 'react'
import { createListing } from '../lib/api'
import { SKILLS } from '../lib/skills'
import type { ListingMode } from '../types'
import './LoginPage.css'
import './CreateListingPage.css'

export default function CreateListingPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    const root = board.current
    if (!root) return
    const update = () => {
      const origin = root.getBoundingClientRect()
      const pin = (selector: string) => {
        const element = root.querySelector<HTMLElement>(selector)
        if (!element?.getClientRects().length) return null
        const rect = element.getBoundingClientRect()
        return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top }
      }
      const top = pin('.login-brand .login-thread-pin')
      const left = pin('.login-board-note-left .login-thread-pin')
      const right = pin('.login-board-note-right .login-thread-pin')
      if (!top || !left || !right) return setThreads([])
      setThreads([`M ${top.x} ${top.y} Q ${(top.x + left.x) / 2} ${(top.y + left.y) / 2 + 2} ${left.x} ${left.y}`, `M ${top.x} ${top.y} Q ${(top.x + right.x) / 2} ${(top.y + right.y) / 2 + 2} ${right.x} ${right.y}`])
    }
    const observer = new ResizeObserver(update)
    observer.observe(root)
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (posting) return
    const data = new FormData(event.currentTarget)
    const mode = data.get('mode')
    if (mode !== 'in_person' && mode !== 'online') {
      setError('Please choose a valid meeting mode.')
      return
    }
    setPosting(true)
    setError('')
    try {
      const created = await createListing({
        title: String(data.get('title') || '').trim(),
        description: String(data.get('description') || '').trim(),
        category: String(data.get('offer') || ''),
        meet_spot: String(data.get('place') || '').trim() || null,
        mode,
        available_when: `${String(data.get('date') || '').trim()}, ${String(data.get('time') || '').trim()}`,
      })
      localStorage.setItem('myListingId', created.id)
      localStorage.setItem('myListingTitle', created.title)
      window.location.assign('/browse')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not publish your listing.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <main className="login-page listing-page" ref={board}>
      <svg className="login-thread-overlay" aria-hidden="true" focusable="false">{threads.map((path, index) => <path key={index} className="login-thread-core" d={path} />)}</svg>
      <div className="login-board-notes" aria-hidden="true">
        <img className="login-magnifier login-magnifier-left" src="/images/magnifying-glass.svg" alt="" />
        <img className="login-magnifier login-magnifier-right" src="/images/magnifying-glass.svg" alt="" />
        <div className="login-board-note login-board-note-left"><i className="login-thread-pin" /><span>The exchange board</span><p>Good at something?<br />Someone here<br />could use your help.</p><small>Share a skill. Learn another.</small></div>
        <div className="login-board-note login-board-note-right"><i className="login-thread-pin" /><span>A simple agreement</span><p>Your know-how.<br />Their next step.</p><small>That’s a fair exchange.</small></div>
      </div>
      <div className="login-wrap listing-wrap">
        <a className="login-brand listing-brand" href="/home"><i className="login-thread-pin" aria-hidden="true" />Barter Buddies<span>Skills shared. Possibilities opened.</span></a>
        <section className="login-panel listing-panel" aria-labelledby="listing-heading">
          <header className="login-header"><h1 id="listing-heading">Publish a Barter</h1><p className="listing-intro">Start a listing and give the crew the coordinates for a fair exchange.</p></header>
          <form onSubmit={handleSubmit} aria-busy={posting}>
            <fieldset className="listing-box"><legend>Listing</legend><label htmlFor="listing-title">Start a listing</label><input id="listing-title" name="title" required placeholder="What can you teach or help with?" /><label htmlFor="listing-description">Describe your offer</label><textarea id="listing-description" name="description" required placeholder="Share your experience, format, or session details" /></fieldset>
            <fieldset className="listing-box"><legend>Offer</legend><label htmlFor="listing-offer">What are you offering?</label><select id="listing-offer" name="offer" defaultValue="" required><option value="" disabled>Select a skill</option>{SKILLS.map(skill => <option key={skill.id} value={skill.id}>{skill.label}</option>)}</select></fieldset>
            <fieldset className="listing-box"><legend>Counter Ask</legend><label htmlFor="listing-ask">What skill do you need?</label><select id="listing-ask" name="ask" defaultValue="" required><option value="" disabled>Select a skill needed</option>{SKILLS.map(skill => <option key={skill.id} value={skill.id}>{skill.label}</option>)}</select></fieldset>
            <fieldset className="listing-box listing-coordinates"><legend>Coordinates</legend><div><label htmlFor="listing-date">Date</label><input id="listing-date" name="date" required placeholder="Thu 9 Oct" /></div><div><label htmlFor="listing-time">Time</label><input id="listing-time" name="time" required placeholder="6:00 PM" /></div><div><label htmlFor="listing-place">Place</label><input id="listing-place" name="place" placeholder="Enter a meetup place" /></div><div><label htmlFor="listing-mode">Mode</label><select id="listing-mode" name="mode" defaultValue="" required><option value="" disabled>Select mode</option><option value="in_person">In person</option><option value="online">Online</option></select></div></fieldset>
            <fieldset className="listing-box listing-validate"><legend>Validate Listing</legend><label><input type="checkbox" required /> Confirmed the barter details.</label></fieldset>
            {error && <p className="listing-submit-error" role="alert">{error}</p>}
            <div className="listing-actions"><a className="listing-skip listing-back" href="/add-details">← Back</a><button className="details-submit listing-publish" type="submit" disabled={posting}>{posting ? 'Posting…' : 'Publish'}</button><a className="listing-skip" href="/home">Home</a></div>
          </form>
        </section>
        <footer className="login-footer"><span>The briefing room</span><a href="/home">Back to the community</a></footer>
      </div>
    </main>
  )
}
