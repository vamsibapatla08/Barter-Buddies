from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user
from app.db import connection
from app.models import ProfilePatch

router = APIRouter(tags=["profiles"])


def _profile(user_id: str):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT p.id, p.display_name AS name, p.file_code, p.bio,
                      coalesce(p.rating_avg, 0)::float AS rating,
                      (SELECT count(*) FROM reviews r WHERE r.reviewee_id = p.id) AS review_count,
                      (SELECT count(*) FROM exchanges e
                       WHERE e.status = 'completed' AND (e.requester_id = p.id OR e.recipient_id = p.id)) AS completed_exchanges
               FROM profiles p WHERE p.id = %s""",
            (user_id,),
        )
        profile = cur.fetchone()
        if profile is None:
            return None
        cur.execute(
            """SELECT r.id, r.stars, r.note, r.created_at,
                      jsonb_build_object('id', reviewer.id, 'name', reviewer.display_name,
                                         'file_code', reviewer.file_code) AS reviewer
               FROM reviews r JOIN profiles reviewer ON reviewer.id = r.reviewer_id
               WHERE r.reviewee_id = %s ORDER BY r.created_at DESC LIMIT 20""",
            (user_id,),
        )
        profile["reviews"] = cur.fetchall()
        return profile


@router.get("/me")
def get_me(user_id: str = Depends(current_user)):
    profile = _profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/profiles/{profile_id}")
def get_profile(profile_id: str):
    profile = _profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/me")
def patch_me(body: ProfilePatch, user_id: str = Depends(current_user)):
    # Model field -> profiles column. ProfilePatch.location has no column and is ignored.
    columns = {"name": "display_name", "file_code": "file_code", "bio": "bio"}
    updates = {columns[key]: value for key, value in body.model_dump(exclude_unset=True).items() if key in columns}
    if not updates:
        return get_me(user_id)
    assignments = ", ".join(f"{column} = %s" for column in updates)
    values = list(updates.values())
    with connection() as conn, conn.cursor() as cur:
        cur.execute(f"UPDATE profiles SET {assignments} WHERE id = %s", (*values, user_id))
    return get_me(user_id)
