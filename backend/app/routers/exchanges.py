from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import current_user
from app.db import connection
from app.exchange_states import can_transition
from app.models import ExchangeIn, RespondIn

router = APIRouter(prefix="/exchanges", tags=["exchanges"])

# requester_gives / recipient_gives are not stored; they are the two listings' titles.
_DETAIL_SQL = """SELECT e.id, e.status, e.created_at, e.source, e.locked_at,
                         e.terms_when, e.terms_where, e.terms_mode, e.note,
                         requester_listing.title AS requester_gives,
                         recipient_listing.title AS recipient_gives,
                         e.requester_completed, e.recipient_completed, t.id AS thread_id,
                         requester.id AS requester_id, requester.display_name AS requester_name,
                         requester.file_code AS requester_file_code,
                         recipient.id AS recipient_id, recipient.display_name AS recipient_name,
                         recipient.file_code AS recipient_file_code
                  FROM exchanges e
                  JOIN profiles requester ON requester.id = e.requester_id
                  JOIN profiles recipient ON recipient.id = e.recipient_id
                  JOIN listings requester_listing ON requester_listing.id = e.requester_listing_id
                  JOIN listings recipient_listing ON recipient_listing.id = e.recipient_listing_id
                  LEFT JOIN threads t ON t.exchange_id = e.id
                  WHERE e.id = %s"""


def _shape(row):
    return {
        "id": str(row["id"]), "status": row["status"], "created_at": row["created_at"],
        "source": row["source"], "locked_at": row["locked_at"],
        "terms": {
            "requester_gives": row["requester_gives"], "recipient_gives": row["recipient_gives"],
            "when": row["terms_when"], "where": row["terms_where"], "mode": row["terms_mode"], "note": row["note"],
        },
        "requester_completed": row["requester_completed"], "recipient_completed": row["recipient_completed"],
        "thread_id": str(row["thread_id"]) if row["thread_id"] else None,
        "requester": {"id": str(row["requester_id"]), "name": row["requester_name"], "file_code": row["requester_file_code"]},
        "recipient": {"id": str(row["recipient_id"]), "name": row["recipient_name"], "file_code": row["recipient_file_code"]},
    }


def _get_exchange(cur, exchange_id):
    cur.execute(_DETAIL_SQL, (exchange_id,))
    row = cur.fetchone()
    return _shape(row) if row else None


@router.post("", status_code=status.HTTP_201_CREATED)
def propose(body: ExchangeIn, user_id: str = Depends(current_user)):
    if body.recipient_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot propose an exchange to yourself")
    if body.source not in ("browse", "match"):
        raise HTTPException(status_code=400, detail="source must be 'browse' or 'match'")
    if body.terms.mode not in ("in_person", "online"):
        raise HTTPException(status_code=400, detail="terms.mode must be 'in_person' or 'online'")
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM listings WHERE id = %s AND active = TRUE", (body.requester_listing_id,))
        requester_listing = cur.fetchone()
        cur.execute("SELECT owner_id FROM listings WHERE id = %s AND active = TRUE", (body.recipient_listing_id,))
        recipient_listing = cur.fetchone()
        if not requester_listing or str(requester_listing["owner_id"]) != user_id:
            raise HTTPException(status_code=400, detail="requester_listing_id must be your active offer")
        if not recipient_listing or str(recipient_listing["owner_id"]) != body.recipient_id:
            raise HTTPException(status_code=400, detail="recipient_listing_id must be the recipient's active offer")
        cur.execute(
            """INSERT INTO exchanges (requester_id, recipient_id, requester_listing_id, recipient_listing_id,
                                      terms_when, terms_where, terms_mode, note, source, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'proposed') RETURNING id""",
            (user_id, body.recipient_id, body.requester_listing_id, body.recipient_listing_id,
             body.terms.when, body.terms.where, body.terms.mode, body.terms.note, body.source),
        )
        exchange_id = cur.fetchone()["id"]
        return _get_exchange(cur, exchange_id)


@router.get("/mine")
def mine(user_id: str = Depends(current_user)):
    result = {"incoming": [], "pending": [], "active": [], "closed": []}
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT e.id, e.status, e.created_at, e.requester_id, e.recipient_id,
                      requester_listing.title AS requester_gives, recipient_listing.title AS recipient_gives,
                      requester.id AS requester_profile_id, requester.display_name AS requester_name,
                      requester.file_code AS requester_file_code, recipient.id AS recipient_profile_id,
                      recipient.display_name AS recipient_name, recipient.file_code AS recipient_file_code
               FROM exchanges e
               JOIN profiles requester ON requester.id = e.requester_id
               JOIN profiles recipient ON recipient.id = e.recipient_id
               JOIN listings requester_listing ON requester_listing.id = e.requester_listing_id
               JOIN listings recipient_listing ON recipient_listing.id = e.recipient_listing_id
               WHERE e.requester_id = %s OR e.recipient_id = %s ORDER BY e.created_at DESC""",
            (user_id, user_id),
        )
        for row in cur.fetchall():
            incoming = str(row["recipient_id"]) == user_id and row["status"] == "proposed"
            if incoming:
                bucket = "incoming"
            elif row["status"] == "proposed":
                bucket = "pending"
            elif row["status"] in ("accepted", "locked"):
                bucket = "active"
            else:
                bucket = "closed"
            other_is_requester = str(row["requester_id"]) != user_id
            person_prefix = "requester" if other_is_requester else "recipient"
            summary = row["requester_gives" if other_is_requester else "recipient_gives"]
            result[bucket].append({
                "id": str(row["id"]), "status": row["status"],
                "other": {"id": str(row[f"{person_prefix}_profile_id"]), "name": row[f"{person_prefix}_name"], "file_code": row[f"{person_prefix}_file_code"]},
                "summary": summary, "created_at": row["created_at"],
            })
    return result


@router.get("/{exchange_id}")
def get_exchange(exchange_id: str, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT requester_id, recipient_id FROM exchanges WHERE id = %s", (exchange_id,))
        membership = cur.fetchone()
        if membership is None:
            raise HTTPException(status_code=404, detail="Exchange not found")
        if user_id not in (str(membership["requester_id"]), str(membership["recipient_id"])):
            raise HTTPException(status_code=403, detail="You are not part of this exchange")
        return _get_exchange(cur, exchange_id)


@router.post("/{exchange_id}/respond")
def respond(exchange_id: str, body: RespondIn, user_id: str = Depends(current_user)):
    if body.action not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'decline'")
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM exchanges WHERE id = %s FOR UPDATE", (exchange_id,))
        exchange = cur.fetchone()
        if exchange is None:
            raise HTTPException(status_code=404, detail="Exchange not found")
        if str(exchange["recipient_id"]) != user_id:
            raise HTTPException(status_code=403, detail="Only the recipient can respond")
        if not can_transition(exchange["status"], body.action, is_requester=False):
            raise HTTPException(status_code=409, detail="Exchange is no longer awaiting a response")
        new_status = "accepted" if body.action == "accept" else "declined"
        cur.execute("UPDATE exchanges SET status = %s WHERE id = %s", (new_status, exchange_id))
        if new_status == "accepted":
            cur.execute("INSERT INTO threads (exchange_id) VALUES (%s) ON CONFLICT (exchange_id) DO NOTHING", (exchange_id,))
        return _get_exchange(cur, exchange_id)


@router.post("/{exchange_id}/lock")
def lock(exchange_id: str, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM exchanges WHERE id = %s FOR UPDATE", (exchange_id,))
        exchange = cur.fetchone()
        if exchange is None:
            raise HTTPException(status_code=404, detail="Exchange not found")
        if user_id not in (str(exchange["requester_id"]), str(exchange["recipient_id"])):
            raise HTTPException(status_code=403, detail="You are not part of this exchange")
        if not can_transition(exchange["status"], "lock", user_id == str(exchange["requester_id"])):
            raise HTTPException(status_code=409, detail="Only an accepted exchange can be locked")
        cur.execute("UPDATE exchanges SET status = 'locked', locked_at = now() WHERE id = %s", (exchange_id,))
        return _get_exchange(cur, exchange_id)


@router.post("/{exchange_id}/complete")
def complete(exchange_id: str, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM exchanges WHERE id = %s FOR UPDATE", (exchange_id,))
        exchange = cur.fetchone()
        if exchange is None:
            raise HTTPException(status_code=404, detail="Exchange not found")
        if user_id not in (str(exchange["requester_id"]), str(exchange["recipient_id"])):
            raise HTTPException(status_code=403, detail="You are not part of this exchange")
        if not can_transition(exchange["status"], "complete", user_id == str(exchange["requester_id"])):
            raise HTTPException(status_code=409, detail="Only a locked exchange can be completed")
        requester_done = exchange["requester_completed"] or str(exchange["requester_id"]) == user_id
        recipient_done = exchange["recipient_completed"] or str(exchange["recipient_id"]) == user_id
        new_status = "completed" if requester_done and recipient_done else "locked"
        cur.execute("UPDATE exchanges SET requester_completed = %s, recipient_completed = %s, status = %s WHERE id = %s", (requester_done, recipient_done, new_status, exchange_id))
        return _get_exchange(cur, exchange_id)
