"""Insert repeatable demo profiles and listings into DATABASE_URL."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import connection

DEMO = [
    ("00000000-0000-4000-8000-000000000001", "Alex Rivera", "DEMO-001", "Bike repair and tune-ups", "Fix a flat, adjust gears, or tune your bike.", "Bike repair", "offer"),
    ("00000000-0000-4000-8000-000000000002", "Jordan Lee", "DEMO-002", "Conversational Spanish", "Practice everyday Spanish with a patient conversation partner.", "Spanish conversation", "offer"),
    ("00000000-0000-4000-8000-000000000002", "Jordan Lee", "DEMO-002", "Help with algebra", "Looking for help reviewing algebra before exams.", "Algebra tutoring", "want"),
    ("00000000-0000-4000-8000-000000000003", "Sam Patel", "DEMO-003", "Algebra tutoring", "High school and college algebra practice.", "Algebra tutoring", "offer"),
    ("00000000-0000-4000-8000-000000000003", "Sam Patel", "DEMO-003", "Bike repair", "I can trade tutoring for a basic bike tune-up.", "Bike repair", "want"),
]


def seed():
    with connection() as conn, conn.cursor() as cur:
        for user_id, name, file_code, title, description, category, kind in DEMO:
            cur.execute(
                """INSERT INTO profiles (id, name, file_code) VALUES (%s, %s, %s)
                   ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, file_code = EXCLUDED.file_code""",
                (user_id, name, file_code),
            )
            cur.execute(
                """INSERT INTO listings (owner_id, title, description, category, kind)
                   SELECT %s, %s, %s, %s, %s
                   WHERE NOT EXISTS (SELECT 1 FROM listings WHERE owner_id = %s AND title = %s AND kind = %s)""",
                (user_id, title, description, category, kind, user_id, title, kind),
            )
    print("Seeded demo profiles and listings.")


if __name__ == "__main__":
    seed()
