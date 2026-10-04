"""Supabase JWT authentication dependency."""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

bearer = HTTPBearer(auto_error=False)
settings = get_settings()
jwks_client = (
    jwt.PyJWKClient(f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json")
    if settings.supabase_url
    else None
)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        token = credentials.credentials
        algorithm = jwt.get_unverified_header(token).get("alg")
        if algorithm not in ["HS256", "ES256", "RS256"]:
            raise ValueError("Unsupported JWT algorithm")
        if algorithm == "HS256":
            key = get_settings().supabase_jwt_secret
            if not key:
                raise HTTPException(status_code=500, detail="Authentication is not configured")
        else:
            if jwks_client is None:
                raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured")
            key = jwks_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(token, key, algorithms=[algorithm], audience="authenticated")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("JWT subject is missing")
        return str(user_id)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None
