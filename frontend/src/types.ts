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

<<<<<<< HEAD
export type ListingCreateIn = {
  title: string
  description: string
  category: string
  meet_spot: string | null
  mode: 'in_person' | 'online'
=======
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
>>>>>>> e13a31ac52a5c304b2188da547b6a3859c0dc118
  available_when: string | null
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
