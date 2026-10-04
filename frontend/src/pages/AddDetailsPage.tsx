import { useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './LoginPage.css'
import './AddDetailsPage.css'

const avatarRoles = [
  ['target', 'Target', '◎'], ['hacker', 'Hacker', '⌨'], ['architect', 'Architect', '⌂'], ['cipher', 'Cipher', 'Aa'],
  ['mastermind', 'Mastermind', '♟'], ['safecracker', 'Safecracker', '◉'], ['lookout', 'Lookout', '◉'], ['getaway', 'Getaway driver', '↗'],
  ['forensics', 'Forensics', '✣'], ['detective', 'Detective', '⌕'], ['informant', 'Informant', '◌'], ['locksmith', 'Locksmith', '⚿'],
  ['decoy', 'Decoy', '◇'], ['strategist', 'Strategist', '♜'], ['infiltrator', 'Infiltrator', '◈'], ['analyst', 'Analyst', '∑'],
  ['scout', 'Scout', '⌖'], ['acrobat', 'Acrobat', '✳'], ['negotiator', 'Negotiator', '⇄'], ['archivist', 'Archivist', '▤'],
] as const

function roleAvatar(id: string) {
  const motif: Record<string, string> = {
    hacker: '<path d="m49 52-10 12 10 12m30-24 10 12-10 12m-7-30L57 78"/>',
    architect: '<path d="M43 80V59l21-16 21 16v21H72V66H56v14zM53 55h8m10 0h8"/>',
    cipher: '<text x="64" y="71" fill="#ff2938" stroke="none" font-family="monospace" font-size="22" font-weight="700" text-anchor="middle">Aa</text>',
    mastermind: '<path d="M48 81V66a7 7 0 0 1 14 0V53a7 7 0 0 1 14 0v15l6-6a6 6 0 0 1 9 8L78 86H56z"/>',
    safecracker: '<circle cx="64" cy="64" r="17"/><circle cx="64" cy="64" r="4"/><path d="M64 47v13m0 8v13M47 64h13m8 0h13M52 52l9 9m6 6 9 9m0-24-9 9m-6 6-9 9"/>',
    lookout: '<path d="M40 64s9-15 24-15 24 15 24 15-9 15-24 15-24-15-24-15z"/><circle cx="64" cy="64" r="7"/>',
    getaway: '<path d="M42 71h8l7-16h23l9 16h7v9H42zM57 55l-4 12h32l-7-12z"/><circle cx="55" cy="79" r="5"/><circle cx="82" cy="79" r="5"/><path d="M47 48h17m-12-7h17"/>',
    forensics: '<path d="M53 45h22m-17 0v14L47 77a6 6 0 0 0 5 9h24a6 6 0 0 0 5-9L69 59V45M52 73h24"/><circle cx="59" cy="68" r="2"/><circle cx="68" cy="79" r="2"/>',
    detective: '<circle cx="64" cy="62" r="20"/><path d="M48 53h32M53 44l5-7h13l5 7M76 76l13 13m-5-5 5-5"/>',
    informant: '<path d="M45 47h38v27H64L52 84v-10h-7zM53 57h22m-22 8h15"/>',
    locksmith: '<circle cx="57" cy="57" r="12"/><path d="m66 66 19 19m-7-7 6-6m-12 0 6-6"/>',
    decoy: '<path d="M44 48h40v32H44zM52 57h7m10 0h7m-24 14h24"/><path d="m54 48 10-8 10 8"/>',
    strategist: '<path d="M45 79V59h12v20m4 0V45h12v34m4 0V55h10v24zM44 84h44"/>',
    infiltrator: '<path d="M64 42 85 64 64 86 43 64z"/><path d="M55 64h18m-9-9v18"/>',
    analyst: '<path d="M45 79h38M51 73l9-13 8 7 12-19M51 52h12m-12 8h5"/>',
    scout: '<circle cx="64" cy="64" r="18"/><path d="M64 37v17m0 20v17M37 64h17m20 0h17M64 59l6 5-6 5-6-5z"/>',
    acrobat: '<circle cx="64" cy="47" r="6"/><path d="m64 54-9 13 15 5 10-12m-25 7-10 12m25-7 9 10m-20-21-9-9"/>',
    negotiator: '<path d="M43 49h29l8 8-8 8H43zM85 64H56l-8 8 8 8h29zM66 57l-8 7m4 8 7-8"/>',
    archivist: '<path d="M45 45h31l8 8v31H45zM76 45v10h8M52 63h24m-24 7h24m-24 7h17"/>',
  }
  const overlay = id === 'cipher'
    ? motif[id]
    : `<g fill="none" stroke="#ff2938" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${motif[id] ?? ''}</g>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#090909"/><g fill="none" stroke="#f01827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="64" cy="64" r="48" stroke-width="3"/><circle cx="64" cy="64" r="34" stroke-width="1.5"/><path d="M64 4v25m0 70v25M4 64h25m70 0h25"/><path d="M64 29v8m0 54v8M29 64h8m54 0h8"/></g>${overlay}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function AddDetailsPage() {
  const board = useRef<HTMLElement>(null)
  const [threads, setThreads] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState('target')

  function removeUploadedAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
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
    root.querySelectorAll('.login-wrap, .login-brand, .login-board-note, .login-exchange-ticket, .login-wanted-note').forEach(node => observer.observe(node))
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordError('')
    setSubmitted(true)
  }

  return (
    <main className="login-page details-page" ref={board}>
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
      <div className="login-wrap details-wrap">
        <a className="login-brand details-brand" href="/">
          <i className="login-thread-pin" aria-hidden="true" />
          Barter Buddies
          <span>Skills shared. Possibilities opened.</span>
        </a>
        <section
          className="login-panel details-panel"
          aria-labelledby="details-heading"
          onScroll={event => {
            const offset = Math.min(event.currentTarget.scrollTop * 0.12, 48)
            board.current?.style.setProperty('--details-scroll-offset', `${offset}px`)
          }}
        >
          <img className="login-map-fragment" src="/images/briefing-map.svg" alt="" aria-hidden="true" width="340" height="460" draggable={false} />
          <header className="login-header">
            <p className="login-eyebrow">New member file</p>
            <h1 id="details-heading">Add your details</h1>
            <p className="details-intro">
            Tell the crew a little about yourself before you enter the network.
            </p>
          </header>

          {submitted ? (
            <div className="details-notice" role="status">
              Your details are ready for the next step.
              <a href="/login">Continue to sign in</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <fieldset className="details-avatars">
                <legend>Choose your cover identity</legend>
                <p className="details-avatar-hint">Pick a role for your case file, or upload your own image.</p>
                <div className="details-avatar-grid" role="group" aria-label="Preset heist and detective avatars, plus upload option">
                  {avatarRoles.map(([id, name]) => (
                    <button
                      className={`details-avatar-choice${selectedAvatar === id && !avatarPreview ? ' is-selected' : ''}`}
                      key={id}
                      type="button"
                      onClick={() => {
                        removeUploadedAvatar()
                        setSelectedAvatar(id)
                      }}
                      aria-pressed={selectedAvatar === id && !avatarPreview}
                      aria-label={`Choose ${name} avatar`}
                    >
                      <img src={id === 'target' ? '/images/member-avatar.jpg' : roleAvatar(id)} alt="" />
                      <span>{name}</span>
                    </button>
                  ))}
                  <div className="details-avatar-upload-wrap">
                    <label className={`details-avatar-choice details-avatar-upload-choice${avatarPreview ? ' is-selected' : ''}`}>
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Uploaded avatar preview" />
                        : <span className="details-avatar-plus" aria-hidden="true">+</span>}
                      <span>{avatarPreview ? 'Uploaded photo' : 'Upload your own'}</span>
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        aria-label="Upload an avatar from your computer"
                        onChange={event => {
                          const file = event.currentTarget.files?.[0]
                          event.currentTarget.value = ''
                          if (file) {
                            removeUploadedAvatar()
                            setAvatarPreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                    {avatarPreview && <button className="details-avatar-delete" type="button" onClick={removeUploadedAvatar} aria-label="Remove uploaded picture" title="Remove uploaded picture">×</button>}
                  </div>
                </div>
              </fieldset>
              <div className="login-field details-field">
                <label htmlFor="details-name">Your name</label>
                <input id="details-name" name="name" type="text" autoComplete="name" required />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-email">Email address</label>
                <input id="details-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-password">Create a new password</label>
                <input
                  id="details-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value)
                    setPasswordError('')
                  }}
                />
              </div>
              <div className="login-field details-field">
                <label htmlFor="details-confirm-password">Confirm your password</label>
                <input
                  id="details-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={event => {
                    setConfirmPassword(event.target.value)
                    setPasswordError('')
                  }}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'details-password-error' : undefined}
                />
                {passwordError && (
                  <p className="login-field-error" id="details-password-error">
                    {passwordError}
                  </p>
                )}
              </div>
              <button className="details-submit" type="submit">
                Continue
              </button>
            </form>
          )}
          <p className="login-signup details-back">
            Already have an account? <a href="/login">Return to sign in</a>
          </p>
        </section>
        <footer className="login-footer">
          <span>The briefing room</span>
          <a href="/">Back to the community</a>
        </footer>
      </div>
    </main>
  )
}
