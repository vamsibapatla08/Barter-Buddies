export type PersonRef = {
  id: string
  name: string
  file_code?: string | null
}

export type Listing = {
  id: string
  title: string
  description: string
  category: string
  owner?: PersonRef
}

export type Match = {
  user_id: string
  name: string
  file_code?: string | null
  score: number
  mutual: boolean
  they_give: SkillRef
  you_give: SkillRef
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
