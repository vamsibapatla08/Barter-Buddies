"""Insert repeatable demo users, profiles, offers and wants into DATABASE_URL.

Run from backend/:  python scripts/seed.py

DATABASE_URL (read from backend/.env) must connect as a role that can write to
auth.users (e.g. postgres). The demo users have no password, so they cannot
sign in. Every statement is ON CONFLICT DO NOTHING, so running this twice is
safe and the second run inserts nothing.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import connection

# (user_id, email, display_name, file_code)
# Emails must end in @my.utsa.edu or the check_utsa_email trigger rejects them.
PEOPLE = [
    ("00000000-0000-4000-8000-000000000001", "priya.s@my.utsa.edu", "Priya S.", "BB-1041"),
    ("00000000-0000-4000-8000-000000000002", "marisol.t@my.utsa.edu", "Marisol T.", "BB-1042"),
    ("00000000-0000-4000-8000-000000000003", "devan.o@my.utsa.edu", "Devan O.", "BB-1043"),
    ("00000000-0000-4000-8000-000000000004", "jae.l@my.utsa.edu", "Jae L.", "BB-1044"),
    ("00000000-0000-4000-8000-000000000005", "ana.r@my.utsa.edu", "Ana R.", "BB-1045"),
    ("00000000-0000-4000-8000-000000000006", "sam.k@my.utsa.edu", "Sam K.", "BB-1046"),
]

# (listing_id, owner_id, skill_id, title, detail, meet_spot, mode, available_when)
# Every skill_id below comes from the skills seed in schema.sql.
LISTINGS = [
    ("10000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000001", "CALCULUS_TUTORING",
     "Calc I & II exam prep", "Two years of tutoring Calc I and II. We work through your practice exam together.",
     "JPL library, 2nd floor", "in_person", "Weekday evenings"),
    ("10000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000001", "PYTHON_HELP",
     "Python debugging help", "Stuck on a CS assignment? I will read your traceback and walk you through the fix.",
     "Zoom", "online", "Most nights after 7pm"),
    ("10000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000002", "GEL_MANICURE",
     "Gel manicure, full set", "Full gel set in the colour of your choice. Bring your own design ideas.",
     "Chisholm Hall lounge", "in_person", "Saturday mornings"),
    ("10000000-0000-4000-8000-000000000004", "00000000-0000-4000-8000-000000000002", "NAIL_ART",
     "Hand-painted nail art", "Freehand art on top of an existing set. Takes about an hour.",
     "Chisholm Hall lounge", "in_person", "Weekends"),
    ("10000000-0000-4000-8000-000000000005", "00000000-0000-4000-8000-000000000003", "AIRPORT_RIDE",
     "Ride to SAT airport", "I drive and I know the cheap parking. Room for two bags.",
     "Ximenes garage", "in_person", "Breaks and holiday weekends"),
    ("10000000-0000-4000-8000-000000000006", "00000000-0000-4000-8000-000000000003", "GROCERY_RUN",
     "Grocery run to HEB", "Weekly HEB trip. Send me your list and I will bring it back to your dorm.",
     "Roadrunner Cafe entrance", "in_person", "Sunday afternoons"),
    ("10000000-0000-4000-8000-000000000007", "00000000-0000-4000-8000-000000000004", "LOGO_DESIGN",
     "Logo for your club or brand", "Three concepts, one revision round, final files as SVG and PNG.",
     "Figma and email", "online", "Within a week of asking"),
    ("10000000-0000-4000-8000-000000000008", "00000000-0000-4000-8000-000000000004", "PHOTOGRAPHY",
     "Grad photos on campus", "An hour around the Sombrilla, 30 edited photos back to you.",
     "Sombrilla Plaza", "in_person", "Golden hour, most days"),
    ("10000000-0000-4000-8000-000000000009", "00000000-0000-4000-8000-000000000005", "GUITAR_LESSON",
     "Beginner guitar lessons", "Chords, strumming patterns and your first few songs. Guitar provided.",
     "Arts building practice room", "in_person", "Tuesday and Thursday afternoons"),
    ("10000000-0000-4000-8000-000000000010", "00000000-0000-4000-8000-000000000005", "BAKING",
     "Birthday cakes and cupcakes", "Everything from scratch. Tell me the flavour and how many people.",
     "Pickup near Tobin Ave", "in_person", "Two days notice, please"),
    ("10000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000006", "RESUME_REVIEW",
     "Resume and LinkedIn review", "A line-by-line edit plus the two changes that matter most for internships.",
     "Google Docs", "online", "Turnaround in 48 hours"),
    ("10000000-0000-4000-8000-000000000012", "00000000-0000-4000-8000-000000000006", "WORKOUT_PLAN",
     "Four-week workout plan", "Built around the RWC equipment and the days you can actually show up.",
     "Rec center, main floor", "in_person", "Weekday mornings"),
]

# (want_id, owner_id, skill_id)
WANTS = [
    ("20000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000001", "GEL_MANICURE"),
    ("20000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000001", "AIRPORT_RIDE"),
    ("20000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000002", "CALCULUS_TUTORING"),
    ("20000000-0000-4000-8000-000000000004", "00000000-0000-4000-8000-000000000003", "RESUME_REVIEW"),
    ("20000000-0000-4000-8000-000000000005", "00000000-0000-4000-8000-000000000003", "BAKING"),
    ("20000000-0000-4000-8000-000000000006", "00000000-0000-4000-8000-000000000004", "GUITAR_LESSON"),
    ("20000000-0000-4000-8000-000000000007", "00000000-0000-4000-8000-000000000005", "LOGO_DESIGN"),
    ("20000000-0000-4000-8000-000000000008", "00000000-0000-4000-8000-000000000005", "WORKOUT_PLAN"),
    ("20000000-0000-4000-8000-000000000009", "00000000-0000-4000-8000-000000000006", "PHOTOGRAPHY"),
    ("20000000-0000-4000-8000-000000000010", "00000000-0000-4000-8000-000000000006", "GROCERY_RUN"),
]


def seed() -> None:
    inserted = {"auth.users": 0, "profiles": 0, "listings": 0, "wants": 0}
    with connection() as conn, conn.cursor() as cur:
        for user_id, email, display_name, file_code in PEOPLE:
            # auth.users first: profiles.id references it.
            cur.execute(
                """INSERT INTO auth.users (instance_id, id, aud, role, email, email_confirmed_at,
                                           raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                                           confirmation_token, recovery_token, email_change_token_new, email_change)
                   VALUES ('00000000-0000-0000-0000-000000000000', %s, 'authenticated', 'authenticated', %s, now(),
                           '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '')
                   ON CONFLICT (id) DO NOTHING""",
                (user_id, email),
            )
            inserted["auth.users"] += max(cur.rowcount, 0)
            cur.execute(
                """INSERT INTO profiles (id, display_name, file_code)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (id) DO NOTHING""",
                (user_id, display_name, file_code),
            )
            inserted["profiles"] += max(cur.rowcount, 0)
        for listing_id, owner_id, skill_id, title, detail, meet_spot, mode, available_when in LISTINGS:
            cur.execute(
                """INSERT INTO listings (id, owner_id, skill_id, title, detail, meet_spot, mode, available_when, active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                   ON CONFLICT (id) DO NOTHING""",
                (listing_id, owner_id, skill_id, title, detail, meet_spot, mode, available_when),
            )
            inserted["listings"] += max(cur.rowcount, 0)
        for want_id, owner_id, skill_id in WANTS:
            cur.execute(
                """INSERT INTO wants (id, owner_id, skill_id)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (id) DO NOTHING""",
                (want_id, owner_id, skill_id),
            )
            inserted["wants"] += max(cur.rowcount, 0)
    for table, count in inserted.items():
        print(f"{table}: {count} row(s) inserted")
    print(f"Total: {sum(inserted.values())} row(s) inserted (0 means the demo data was already there).")


if __name__ == "__main__":
    seed()
