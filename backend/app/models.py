from __future__ import annotations
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PersonRef(BaseModel):
    id: str
    name: str
    file_code: str | None = None


# ===== Vamsi (B1) =====


class ListingIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    # category carries a skills.id, e.g. "CALCULUS_TUTORING".
    category: str = Field(min_length=1, max_length=80)
    meet_spot: str | None = Field(default=None, max_length=120)
    mode: Literal["in_person", "online"] | None = None
    # Date and time together in one string, e.g. "Thu 9 Oct, 6:00 PM".
    available_when: str | None = Field(default=None, max_length=120)


class ListingOut(ListingIn):
    id: str
    owner: PersonRef | None = None


class SkillOut(BaseModel):
    id: str
    label: str
    category: str


class ProfilePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    file_code: str | None = Field(default=None, max_length=32)
    bio: str | None = Field(default=None, max_length=1000)
    location: str | None = Field(default=None, max_length=120)


class ProfileOut(BaseModel):
    id: str
    name: str
    file_code: str | None = None
    bio: str | None = None
    location: str | None = None
    rank: str | None = None
    rating: float = 0
    review_count: int = 0
    completed_exchanges: int = 0
    reviews: list[dict] = Field(default_factory=list)


class ReportIn(BaseModel):
    reported_user_id: str | None = None
    listing_id: str | None = None
    reason: str = Field(min_length=1, max_length=1000)


# ===== Abhyuday (B2) =====
# Exchange status is always one of:
#   proposed, accepted, locked, completed, declined


class SkillRef(BaseModel):
    skill_id: str
    label: str


class TermsIn(BaseModel):
    requester_gives: str
    recipient_gives: str
    when: str
    where: str
    mode: str
    note: str | None = None


class ExchangeIn(BaseModel):
    recipient_id: str
    requester_listing_id: str
    recipient_listing_id: str
    terms: TermsIn
    source: str  # "browse" or "match"


class ExchangeOut(BaseModel):
    id: str
    status: str
    created_at: datetime
    source: str
    requester: PersonRef
    recipient: PersonRef
    terms: TermsIn
    locked_at: datetime | None = None
    requester_completed: bool
    recipient_completed: bool
    thread_id: str | None = None


class ExchangeSummary(BaseModel):
    id: str
    status: str
    other: PersonRef
    summary: str
    created_at: datetime


class LedgerOut(BaseModel):
    incoming: list[ExchangeSummary]
    pending: list[ExchangeSummary]
    active: list[ExchangeSummary]
    closed: list[ExchangeSummary]


class Breakdown(BaseModel):
    skills: int
    timing: int
    location: int


class MatchOut(BaseModel):
    user_id: str
    name: str
    file_code: str | None = None
    score: int
    mutual: bool
    they_give: SkillRef | None = None
    you_give: SkillRef | None = None
    breakdown: Breakdown


class RespondIn(BaseModel):
    action: str  # "accept" or "decline"
    reason: str | None = None


class ReviewIn(BaseModel):
    exchange_id: str
    stars: int
    note: str | None = None


class ReviewOut(BaseModel):
    id: str
    exchange_id: str
    reviewer: PersonRef
    stars: int
    note: str | None = None
    created_at: datetime
