from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import current_user
from app.db import connection
from app.models import ListingIn

router = APIRouter(tags=["listings"])


@router.post("/listings", status_code=status.HTTP_201_CREATED)
def create_listing(body: ListingIn, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO listings (owner_id, title, description, category, kind)
               VALUES (%s, %s, %s, %s, 'offer')
               RETURNING id, title, description, category""",
            (user_id, body.title, body.description, body.category),
        )
        return cur.fetchone()


@router.post("/wants", status_code=status.HTTP_201_CREATED)
def create_want(body: ListingIn, user_id: str = Depends(current_user)):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """INSERT INTO listings (owner_id, title, description, category, kind)
               VALUES (%s, %s, %s, %s, 'want')
               RETURNING id, title, description, category""",
            (user_id, body.title, body.description, body.category),
        )
        return cur.fetchone()


@router.get("/listings/{listing_id}")
def get_listing(listing_id: str):
    with connection() as conn, conn.cursor() as cur:
        cur.execute(
            """SELECT l.id, l.title, l.description, l.category, l.kind,
                      p.id AS owner_id, p.name AS owner_name, p.file_code AS owner_file_code
               FROM listings l JOIN profiles p ON p.id = l.owner_id
               WHERE l.id = %s AND l.is_active = TRUE""",
            (listing_id,),
        )
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    row["owner"] = {"id": str(row.pop("owner_id")), "name": row.pop("owner_name"), "file_code": row.pop("owner_file_code")}
    return row
