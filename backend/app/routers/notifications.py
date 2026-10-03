from fastapi import APIRouter, Depends

from app.auth import current_user
from app.db import connection

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
def unread_count(user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS unread FROM notifications WHERE user_id = %s AND read_at IS NULL", (user_id,))
        return cur.fetchone()
