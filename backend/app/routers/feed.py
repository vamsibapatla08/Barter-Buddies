from fastapi import APIRouter, Depends

from app.auth import current_user
from app.db import connection

router = APIRouter(tags=["feed"])


@router.get("/feed")
def get_feed(category: str | None = None, user_id: str = Depends(current_user)):
    # Only active offers from other users are browseable; wants are used for matching.
    query = """SELECT l.id, l.title, l.detail AS description, s.category, l.skill_id,
                      jsonb_build_object('id', p.id, 'name', p.display_name, 'file_code', p.file_code) AS owner
               FROM listings l
               JOIN skills s ON s.id = l.skill_id
               JOIN profiles p ON p.id = l.owner_id
               WHERE l.active = TRUE AND l.owner_id <> %s"""
    params: list = [user_id]
    if category:
        query += " AND s.category = %s"
        params.append(category)
    query += " ORDER BY l.created_at DESC LIMIT 100"
    with connection() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()
