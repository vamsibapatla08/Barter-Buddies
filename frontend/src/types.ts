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
