# Barter Buddies

Barter Buddies is a small marketplace for trading skills. The React app is in `frontend/`; the FastAPI API and PostgreSQL schema are in `backend/`.

## Backend setup

1. Create a PostgreSQL database (a Supabase project's database works) and run [`backend/schema.sql`](backend/schema.sql) in its SQL editor.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and `SUPABASE_JWT_SECRET`.
3. Install `backend/requirements.txt`, then run the API from `backend/`:

   ```powershell
   python -m pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

The API listens on `http://localhost:8000`; interactive docs are at `/docs`. It uses the Supabase JWT subject as the profile id. Create a matching profile row before using authenticated endpoints. `python scripts/seed.py` inserts local demo profiles and listings.

## Frontend setup

Set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` for the Vite app, then run `npm install` and `npm run dev` from `frontend/`.

Do not open `frontend/index.html` with VS Code Live Preview. It is a Vite entry point whose
`/src/main.tsx` module must be transformed before the browser can load it. Start Vite from
the `frontend/` directory and open the URL it prints (normally `http://localhost:5173`):

```powershell
cd frontend
npm install
npm run dev
```

See [`CONTRACT.md`](CONTRACT.md) for API request and response shapes.
