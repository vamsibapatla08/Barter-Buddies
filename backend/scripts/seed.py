"""Insert repeatable demo users, profiles, offers and wants into DATABASE_URL.

DATABASE_URL must connect as a role that can write to auth.users (e.g. postgres).
The demo users have no password, so they cannot sign in.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import connection

# Emails must end in @my.utsa.edu or the check_utsa_email trigger rejects them.
PEOPLE = [
    ("00000000-0000-4000-8000-000000000001", "demo1@my.utsa.edu", "Alex Rivera", "DEMO-001"),
    ("00000000-0000-4000-8000-000000000002", "demo2@my.utsa.edu", "Jordan Lee", "DEMO-002"),
    ("00000000-0000-4000-8000-000000000003", "demo3@my.utsa.edu", "Sam Patel", "DEMO-003"),
]

# (owner_id, skill_id, title, detail, mode)
OFFERS = [
    ("00000000-0000-4000-8000-000000000001", "PYTHON_HELP", "Python debugging help", "Stuck on a CS assignment? I can walk you through it.", "online"),
    ("00000000-0000-4000-8000-000000000002", "GUITAR_LESSON", "Beginner guitar lessons", "Chords, strumming and your first few songs.", "in_person"),
    ("00000000-0000-4000-8000-000000000003", "CALCULUS_TUTORING", "Calculus tutoring", "Calc I and II practice before exams.", "in_person"),
]

# (owner_id, skill_id)
WANTS = [
    ("00000000-0000-4000-8000-000000000002", "CALCULUS_TUTORING"),
    ("00000000-0000-4000-8000-000000000003", "GUITAR_LESSON"),
    ("00000000-0000-4000-8000-000000000003", "PYTHON_HELP"),
]


def seed():
    with connection() as conn, conn.cursor() as cur:
        for user_id, email, display_name, file_code in PEOPLE:
            cur.execute(
                """INSERT INTO auth.users (instance_id, id, aud, role, email, email_confirmed_at,
                                           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                                           confirmation_token, recovery_token, email_change_token_new, email_change)
                   VALUES ('00000000-0000-0000-0000-000000000000', %s, 'authenticated', 'authenticated', %s, now(),
                           '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '')
                   ON CONFLICT (id) DO NOTHING""",
                (user_id, email),
            )
            cur.execute(
                """INSERT INTO profiles (id, display_name, file_code) VALUES (%s, %s, %s)
                   ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, file_code = EXCLUDED.file_code""",
                (user_id, display_name, file_code),
            )
        for owner_id, skill_id, title, detail, mode in OFFERS:
            cur.execute(
                """INSERT INTO listings (owner_id, skill_id, title, detail, mode)
                   SELECT %s, %s, %s, %s, %s
                   WHERE NOT EXISTS (SELECT 1 FROM listings WHERE owner_id = %s AND title = %s)""",
                (owner_id, skill_id, title, detail, mode, owner_id, title),
            )
        for owner_id, skill_id in WANTS:
            cur.execute(
                """INSERT INTO wants (owner_id, skill_id)
                   SELECT %s, %s
                   WHERE NOT EXISTS (SELECT 1 FROM wants WHERE owner_id = %s AND skill_id = %s)""",
                (owner_id, skill_id, owner_id, skill_id),
            )
    print("Seeded demo users, profiles, offers and wants.")


if __name__ == "__main__":
    seed()
