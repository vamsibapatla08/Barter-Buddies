from fastapi import APIRouter, Depends

from app.auth import current_user
from app.db import connection
from app.matching import score_match

router = APIRouter(tags=["matches"])


@router.get("/matches")
def get_matches(user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT l.skill_id, s.label FROM listings l JOIN skills s ON s.id = l.skill_id
               WHERE l.owner_id = %s AND l.active = TRUE""",
            (user_id,),
        )
        my_offer_rows = cur.fetchall()
        cur.execute("SELECT skill_id FROM wants WHERE owner_id = %s", (user_id,))
        my_want_rows = cur.fetchall()
        cur.execute(
            """SELECT p.id AS user_id, p.display_name AS name, p.file_code, 'offer' AS kind, l.skill_id, s.label
               FROM profiles p
               JOIN listings l ON l.owner_id = p.id
               JOIN skills s ON s.id = l.skill_id
               WHERE p.id <> %s AND l.active = TRUE
               UNION ALL
               SELECT p.id AS user_id, p.display_name AS name, p.file_code, 'want' AS kind, w.skill_id, s.label
               FROM profiles p
               JOIN wants w ON w.owner_id = p.id
               JOIN skills s ON s.id = w.skill_id
               WHERE p.id <> %s""",
            (user_id, user_id),
        )
        rows = cur.fetchall()

    my_wants = {row["skill_id"] for row in my_want_rows}
    my_offers = {row["skill_id"] for row in my_offer_rows}
    people: dict[str, dict] = {}
    for row in rows:
        key = str(row["user_id"])
        person = people.setdefault(key, {"user_id": key, "name": row["name"], "file_code": row["file_code"], "wants": [], "offers": []})
        person["wants" if row["kind"] == "want" else "offers"].append(row)

    matches = []
    for person in people.values():
        their_wants = {row["skill_id"] for row in person["wants"]}
        their_offers = {row["skill_id"] for row in person["offers"]}
        score = score_match(my_wants, my_offers, their_wants, their_offers)
        if score <= 0:
            continue
        they_give_row = next((row for row in person["offers"] if row["skill_id"] in my_wants), None)
        you_give_row = next((row for row in my_offer_rows if row["skill_id"] in their_wants), None)
        matches.append({
            "user_id": person["user_id"], "name": person["name"], "file_code": person["file_code"],
            "score": score, "mutual": bool(my_wants & their_offers and their_wants & my_offers),
            "they_give": {"skill_id": they_give_row["skill_id"], "label": they_give_row["label"]} if they_give_row else None,
            "you_give": {"skill_id": you_give_row["skill_id"], "label": you_give_row["label"]} if you_give_row else None,
            "breakdown": {"skills": score, "timing": 0, "location": 0},
        })
    return sorted(matches, key=lambda item: (-item["score"], item["name"].casefold()))
