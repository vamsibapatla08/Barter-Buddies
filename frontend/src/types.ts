export type PersonRef = {
  id: string
  name: string
  file_code?: string | null
}

/** One row of GET /feed. Shape comes from backend/app/routers/feed.py. */
export type Listing = {
  id: string
  title: string
  detail: string | null
  /** Legacy alias of `detail`, still selected by /feed for the older pages. */
  description: string | null
  skill_id: string
  skill_label: string
  category: string
  meet_spot: string | null
  mode: string | null
  available_when: string | null
  created_at: string
  owner: PersonRef
}

export type Skill = {
  id: string
  label: string
  category: string
}

export type ListingMode = 'in_person' | 'online'

/** Body of POST /listings. Mirrors ListingIn in backend/app/models.py. */
export type ListingInput = {
  title: string
  description: string
  /** A skill id, e.g. "CALCULUS_TUTORING" — not the human category. */
  category: string
  meet_spot: string | null
  mode: ListingMode
  /** Date and time in one string, e.g. "Thu 9 Oct, 6:00 PM". */
  available_when: string
}

/** Response of POST /listings. Its `category` is the skill's category. */
export type CreatedListing = {
  id: string
  title: string
  description: string | null
  skill_id: string
  category: string
  meet_spot: string | null
  mode: string | null
  available_when: string | null
}

export type ListingCreateIn = ListingInput

/** Response of GET /listings/{id}. Like CreatedListing, plus the owner. */
export type ListingDetail = CreatedListing & {
  owner: PersonRef
}

/** Terms of an exchange. Mirrors TermsIn in backend/app/models.py. */
export type ExchangeTerms = {
  requester_gives: string
  recipient_gives: string
  when: string
  where: string
  mode: string
  note?: string | null
}

/** Body of POST /exchanges. */
export type ProposeInput = {
  recipient_id: string
  requester_listing_id: string
  recipient_listing_id: string
  terms: ExchangeTerms
  source: 'browse' | 'match'
}

/** One row of GET /exchanges/mine. */
export type ExchangeSummary = {
  id: string
  status: string
  /** The other party, never you. */
  other: PersonRef
  summary: string
  created_at: string
}

/** Response of GET /exchanges/mine. */
export type LedgerOut = {
  incoming: ExchangeSummary[]
  pending: ExchangeSummary[]
  active: ExchangeSummary[]
  closed: ExchangeSummary[]
}

export type RespondAction = 'accept' | 'decline'

/** Response of POST /exchanges. */
export type ExchangeOut = {
  id: string
  status: string
  created_at: string
  source: string
  requester: PersonRef
  recipient: PersonRef
  terms: ExchangeTerms
  locked_at?: string | null
  requester_completed: boolean
  recipient_completed: boolean
  thread_id?: string | null
}

export type Match = {
  user_id: string
  name: string
  file_code?: string | null
  score: number
  mutual: boolean
  /** Null on a one-way match. */
  they_give?: SkillRef | null
  /** Null on a one-way match. */
  you_give?: SkillRef | null
  breakdown: Breakdown
}

export type SkillRef = {
  skill_id: string
  label: string
}

export type Breakdown = {
  skills: number
  timing: number
  location: number
}
