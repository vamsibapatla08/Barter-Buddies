import type { Listing } from '../types'

// Avatar tones drawn from the LoginPage palette (cork board, maroon pin, kraft paper).
const AVATAR_TONES = [
  'bg-[#7a263a] text-[#fffaf2]',
  'bg-[#4d6b55] text-[#f6f2df]',
  'bg-[#8a5a2b] text-[#fffaf2]',
  'bg-[#3f5668] text-[#f5eedf]',
  'bg-[#6d4a6b] text-[#fffaf2]',
  'bg-[#946673] text-[#fffdf9]',
]

function toneFor(name: string): string {
  let sum = 0
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

const MODE_LABELS: Record<string, string> = {
  in_person: 'In person',
  online: 'Online',
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const ownerName = listing.owner?.name ?? 'A member'
  const mode = listing.mode ? MODE_LABELS[listing.mode] ?? listing.mode : null

  return (
    <article className="flex h-full flex-col gap-3 border border-[#d7c8ab] border-t-[3px] border-t-[#7a263a] bg-[#fbf8f2] p-5 text-[#302c25] shadow-[1px_3px_6px_#3c281d26]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${toneFor(ownerName)}`}
        >
          {initial(ownerName)}
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[.16em] text-[#7a263a]">{listing.skill_label}</p>
          <span className="mt-1 inline-block border border-[#d7c8ab] bg-[#eee4cf] px-2 py-[2px] text-[10px] uppercase tracking-[.12em] text-[#6d6860]">
            {listing.category}
          </span>
        </div>
      </div>

      <h3 className="m-0 font-serif text-[19px] font-normal leading-snug tracking-[-.02em]">{listing.title}</h3>

      {listing.detail && <p className="m-0 text-[13px] leading-relaxed text-[#4a453d]">{listing.detail}</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#d8d0c4] pt-3 text-[12px] text-[#6d6860]">
        <span className="min-w-0 truncate">
          {ownerName}
          {listing.meet_spot ? ` · ${listing.meet_spot}` : ''}
        </span>
        {mode && (
          <span className="shrink-0 uppercase tracking-[.12em] text-[11px] text-[#7a263a]">{mode}</span>
        )}
      </div>

      {listing.available_when && (
        <p className="m-0 text-[11px] uppercase tracking-[.12em] text-[#8d8679]">{listing.available_when}</p>
      )}
    </article>
  )
}
