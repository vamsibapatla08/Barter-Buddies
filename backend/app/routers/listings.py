from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import current_user
from app.db import connection
from app.models import ListingIn, SkillOut

router = APIRouter(tags=["listings"])


@router.get("/skills", response_model=list[SkillOut])
def get_skills(user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, label, category FROM skills ORDER BY category, label")
        return list(cur.fetchall())


# ListingIn.category carries a skills.id (e.g. "CALCULUS_TUTORING"); the
# response's category is that skill's skills.category (e.g. "tutoring").
@router.post("/listings", status_code=status.HTTP_201_CREATED)
def create_listing(body: ListingIn, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO listings (owner_id, skill_id, title, detail, meet_spot, mode, available_when)
               SELECT %s, s.id, %s, %s, %s, %s, %s FROM skills s WHERE s.id = %s
               RETURNING id, title, detail AS description, skill_id,
                         meet_spot, mode, available_when,
                         (SELECT category FROM skills WHERE id = skill_id) AS category""",
            (user_id, body.title, body.description, body.meet_spot, body.mode, body.available_when, body.category),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=400, detail="category must be a known skill id")
    return row


@router.post("/wants", status_code=status.HTTP_201_CREATED)
def create_want(body: ListingIn, user_id: str = Depends(current_user)):
    # The wants table stores only the skill, so title and description are not saved.
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO wants (owner_id, skill_id)
               SELECT %s, s.id FROM skills s WHERE s.id = %s
               RETURNING id, skill_id,
                         (SELECT label FROM skills WHERE id = skill_id) AS title,
                         (SELECT category FROM skills WHERE id = skill_id) AS category""",
            (user_id, body.category),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=400, detail="category must be a known skill id")
    return row


@router.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT l.id, l.title, l.detail AS description, s.category, l.skill_id,
                      l.meet_spot, l.mode, l.available_when,
                      p.id AS owner_id, p.display_name AS owner_name, p.file_code AS owner_file_code
               FROM listings l
               JOIN skills s ON s.id = l.skill_id
               JOIN profiles p ON p.id = l.owner_id
               WHERE l.id = %s AND l.active = TRUE""",
            (listing_id,),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    row["owner"] = {"id": str(row.pop("owner_id")), "name": row.pop("owner_name"), "file_code": row.pop("owner_file_code")}
    return row
