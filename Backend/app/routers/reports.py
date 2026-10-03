from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import current_user
from app.db import connection
from app.models import ReportIn

router = APIRouter(tags=["reports"])


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(body: ReportIn, user_id: str = Depends(current_user)):
    if body.reported_user_id is None and body.listing_id is None:
        raise HTTPException(status_code=400, detail="A user or listing must be reported")
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO reports (reporter_id, reported_user_id, listing_id, reason)
               VALUES (%s, %s, %s, %s) RETURNING id, created_at""",
            (user_id, body.reported_user_id, body.listing_id, body.reason),
        )
        return cur.fetchone()
