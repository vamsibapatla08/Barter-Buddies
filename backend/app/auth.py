"""Supabase JWT authentication dependency."""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")
    secret = get_settings().supabase_jwt_secret
    if not secret:
        raise HTTPException(status_code=500, detail="Authentication is not configured")
    try:
        payload = jwt.decode(credentials.credentials, secret, algorithms=["HS256"], options={"verify_aud": False})
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("JWT subject is missing")
        return str(user_id)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None
