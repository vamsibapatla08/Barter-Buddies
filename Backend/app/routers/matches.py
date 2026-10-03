from fastapi import APIRouter, Depends

from app.auth import current_user
from app.db import connection
from app.matching import score_match

router = APIRouter(tags=["matches"])


@router.get("/matches")
def get_matches(user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, title, category, kind FROM listings WHERE owner_id = %s AND is_active = TRUE", (user_id,))
        mine = cur.fetchall()
        cur.execute(
            """SELECT p.id AS user_id, p.name, p.file_code, l.id AS listing_id,
                      l.title, l.category, l.kind
               FROM profiles p JOIN listings l ON l.owner_id = p.id
               WHERE p.id <> %s AND l.is_active = TRUE ORDER BY p.name""",
            (user_id,),
        )
        rows = cur.fetchall()

    my_wants = {row["category"] for row in mine if row["kind"] == "want"}
    my_offers = {row["category"] for row in mine if row["kind"] == "offer"}
    people: dict[str, dict] = {}
    for row in rows:
        person = people.setdefault(row["user_id"], {"user_id": row["user_id"], "name": row["name"], "file_code": row["file_code"], "wants": [], "offers": []})
        person["wants" if row["kind"] == "want" else "offers"].append(row)

    matches = []
    for person in people.values():
        their_wants = {row["category"] for row in person["wants"]}
        their_offers = {row["category"] for row in person["offers"]}
        score = score_match(my_wants, my_offers, their_wants, their_offers)
        if score <= 0:
            continue
        they_give_row = next((row for row in person["offers"] if row["category"] in my_wants), None)
        you_give_row = next((row for row in mine if row["category"] in their_wants and row["kind"] == "offer"), None)
        matches.append({
            "user_id": person["user_id"], "name": person["name"], "file_code": person["file_code"],
            "score": score, "mutual": bool(my_wants & their_offers and their_wants & my_offers),
            "they_give": {"skill_id": they_give_row["category"], "label": they_give_row["title"]},
            "you_give": {"skill_id": you_give_row["category"], "label": you_give_row["title"]},
            "breakdown": {"skills": score, "timing": 0, "location": 0},
        })
    return sorted(matches, key=lambda item: (-item["score"], item["name"].casefold()))
