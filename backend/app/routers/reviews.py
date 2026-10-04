from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import current_user
from app.db import connection
from app.models import ReviewIn, ReviewOut

router = APIRouter(tags=["reviews"])


@router.post("/reviews", status_code=status.HTTP_201_CREATED, response_model=ReviewOut)
def create_review(body: ReviewIn, user_id: str = Depends(current_user)):
    if not 1 <= body.stars <= 5:
        raise HTTPException(status_code=400, detail="Stars must be between 1 and 5")
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT requester_id, recipient_id, status FROM exchanges WHERE id = %s FOR UPDATE", (body.exchange_id,))
        exchange = cur.fetchone()
        if exchange is None:
            raise HTTPException(status_code=404, detail="Exchange not found")
        if user_id not in (str(exchange["requester_id"]), str(exchange["recipient_id"])):
            raise HTTPException(status_code=403, detail="You are not part of this exchange")
        if exchange["status"] != "completed":
            raise HTTPException(status_code=409, detail="Reviews are available after completion")
        reviewee_id = exchange["recipient_id"] if str(exchange["requester_id"]) == user_id else exchange["requester_id"]
        cur.execute(
            """INSERT INTO reviews (exchange_id, reviewer_id, reviewee_id, stars, note)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (exchange_id, reviewer_id) DO NOTHING
               RETURNING id, exchange_id, reviewer_id, stars, note, created_at""",
            (body.exchange_id, user_id, reviewee_id, body.stars, body.note),
        )
        review = cur.fetchone()
        if review is None:
            raise HTTPException(status_code=409, detail="You have already reviewed this exchange")
        cur.execute("UPDATE profiles SET rating_avg = (SELECT round(avg(stars), 2) FROM reviews WHERE reviewee_id = %s) WHERE id = %s", (reviewee_id, reviewee_id))
        cur.execute("SELECT id, display_name AS name, file_code FROM profiles WHERE id = %s", (user_id,))
        reviewer = cur.fetchone()
        review["reviewer"] = {"id": str(reviewer["id"]), "name": reviewer["name"], "file_code": reviewer["file_code"]}
        review["id"] = str(review["id"])
        review["exchange_id"] = str(review["exchange_id"])
        review.pop("reviewer_id", None)
        return review
