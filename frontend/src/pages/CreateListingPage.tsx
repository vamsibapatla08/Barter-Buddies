import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createListing, getSkills } from '../lib/api'
import { SPOTS, TIME_OPTIONS, dateOptions } from '../lib/schedule'
import { SKILLS } from '../lib/skills'
import type { ListingMode, Skill } from '../types'
import './LoginPage.css'
import './CreateListingPage.css'

export default function CreateListingPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsError, setSkillsError] = useState('')

  // Computed once per mount so the list always starts at today.
  const [dates] = useState<string[]>(() => dateOptions())

  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [offer, setOffer] = useState('')
  const [ask, setAsk] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [mode, setMode] = useState<ListingMode | ''>('')
  const [place, setPlace] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [posting, setPosting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const online = mode === 'online'

  useEffect(() => {
    // Live ids from the database; the bundled list is the offline fallback.
    getSkills()
      .then(setSkills)
      .catch((error: Error) => {
        setSkills(SKILLS)
        setSkillsError(error.message || 'Could not load the skill list.')
      })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (posting) return
    setSubmitError('')

    if (!title.trim() || !detail.trim() || !offer || !date || !time || !mode || !confirmed) {
      setSubmitError('Fill in every field before publishing.')
      return
    }
    if (!online && !place) {
      setSubmitError('Choose a place, or switch the mode to Online.')
      return
    }

    setPosting(true)
    try {
      const created = await createListing({
        title: title.trim(),
        description: detail.trim(),
        category: offer,
        meet_spot: online ? null : place,
        mode,
        available_when: `${date}, ${time}`,
      })
      localStorage.setItem('myListingId', created.id)
      window.location.assign('/browse')
    } catch (error) {
      setSubmitError((error as Error).message || 'Could not publish that listing.')
      setPosting(false)
    }
  }

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
        <a className="login-brand listing-brand" href="/home"><i className="login-thread-pin" aria-hidden="true" />Barter Buddies<span>Skills shared. Possibilities opened.</span></a>
        <img className="login-map-fragment listing-map" src="/images/briefing-map.svg" alt="" aria-hidden="true" />
        <section className="login-panel listing-panel" aria-labelledby="listing-heading" onScroll={event => {
          const offset = Math.min(event.currentTarget.scrollTop * 0.12, 48)
          board.current?.style.setProperty('--listing-scroll-offset', `${offset}px`)
        }}>
          <header className="login-header">
            <h1 id="listing-heading">Publish a Barter</h1>
            <p className="listing-intro">Start a listing and give the crew the coordinates for a fair exchange.</p>
          </header>
          <form onSubmit={handleSubmit} aria-busy={posting}>
            <fieldset className="listing-box">
              <legend>Listing</legend>
              <label htmlFor="listing-title">Start a listing</label>
              <input id="listing-title" name="title" type="text" placeholder="What can you teach or help with?" required
                value={title} disabled={posting} onChange={event => setTitle(event.target.value)} />
              <label htmlFor="listing-detail">Describe your offer</label>
              <textarea id="listing-detail" name="description" rows={3} required
                placeholder="What exactly will you do, and what should they bring?"
                value={detail} disabled={posting} onChange={event => setDetail(event.target.value)} />
            </fieldset>
            <fieldset className="listing-box">
              <legend>Offer</legend>
              <label htmlFor="listing-offer">What are you offering?</label>
              <select id="listing-offer" name="offer" required disabled={posting || !skills.length}
                value={offer} onChange={event => setOffer(event.target.value)}>
                <option value="" disabled>{skills.length ? 'Select a skill' : 'Loading skills…'}</option>
                {skills.map(skill => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
              </select>
            </fieldset>
            <fieldset className="listing-box">
              <legend>Counter Ask</legend>
              <label htmlFor="listing-ask">What would make this a fair exchange?</label>
              <select id="listing-ask" name="ask" required disabled={posting || !skills.length}
                value={ask} onChange={event => setAsk(event.target.value)}>
                <option value="" disabled>{skills.length ? 'Select a skill needed' : 'Loading skills…'}</option>
                {skills.map(skill => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
              </select>
            </fieldset>
            <fieldset className="listing-box listing-coordinates">
              <legend>Coordinates</legend>
              <div>
                <label htmlFor="listing-date">Date</label>
                <select id="listing-date" name="date" required value={date} disabled={posting}
                  onChange={event => setDate(event.target.value)}>
                  <option value="" disabled>Select a date</option>
                  {dates.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="listing-time">Time</label>
                <select id="listing-time" name="time" required value={time} disabled={posting}
                  onChange={event => setTime(event.target.value)}>
                  <option value="" disabled>Select a time</option>
                  {TIME_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="listing-mode">Mode</label>
                <select id="listing-mode" name="mode" required value={mode} disabled={posting}
                  onChange={event => setMode(event.target.value as ListingMode)}>
                  <option value="" disabled>Select a mode</option>
                  <option value="in_person">In person</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label htmlFor="listing-place">Place</label>
                <select id="listing-place" name="place" required={!online} value={online ? '' : place}
                  disabled={posting || online}
                  aria-describedby={online ? 'listing-place-note' : undefined}
                  onChange={event => setPlace(event.target.value)}>
                  <option value="" disabled>{online ? 'Not needed online' : 'Select a place'}</option>
                  {SPOTS.map(spot => <option key={spot} value={spot}>{spot}</option>)}
                </select>
                {online && <p id="listing-place-note" className="listing-place-note">Online barters need no meeting spot.</p>}
              </div>
            </fieldset>
            <fieldset className="listing-box listing-validate">
              <legend>Validate Listing</legend>
              <label><input type="checkbox" required checked={confirmed} disabled={posting}
                onChange={event => setConfirmed(event.target.checked)} /> Confirmed the barter details.</label>
            </fieldset>
            <div className="listing-actions">
              <a className="listing-skip listing-back" href="/add-details" aria-label="Go back to add your details">← Back</a>
              <button className="details-submit listing-publish" type="submit" disabled={posting}>
                {posting ? 'Posting…' : 'Publish'}
              </button>
              <a className="listing-skip" href="/home" aria-label="Go to the home page">Home</a>
            </div>
            <div role="alert" aria-atomic="true">
              {submitError && <p className="listing-submit-error">{submitError}</p>}
            </div>
          </form>
        </section>
        <footer className="login-footer"><span>The briefing room</span><a href="/home">Back to the community</a></footer>
      </div>
    </main>
  )
}
