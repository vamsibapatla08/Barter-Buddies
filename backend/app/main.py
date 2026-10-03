from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import close_pool
from app.routers import exchanges, feed, listings, matches, notifications, profiles, reports, reviews


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    close_pool()


app = FastAPI(title="Barter Buddies API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(feed.router)
app.include_router(listings.router)
app.include_router(profiles.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(matches.router)
app.include_router(exchanges.router)
app.include_router(reviews.router)


@app.get("/health")
def health():
    return {"status": "ok"}
