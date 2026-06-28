"""
FastAPI dependencies for authentication.

`get_current_user` is what protected routes depend on. Two modes:

1. Clerk configured (CLERK_SECRET_KEY + CLERK_JWKS_URL + CLERK_ISSUER set):
   verifies the real bearer token and syncs the Clerk user into our `users`
   table on first sight (create-on-first-request, no separate webhook
   needed for this project's scope — see README for the webhook alternative).

2. Clerk NOT configured (local dev before you've created a Clerk app):
   falls back to a single deterministic "dev user" so the rest of the app
   (reports, history, etc.) is fully testable without auth wired up yet.
   This fallback is OFF in production — see `_ensure_dev_mode_allowed`.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.clerk import TokenVerificationError, verify_clerk_token
from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()
_bearer_scheme = HTTPBearer(auto_error=False)

DEV_USER_CLERK_ID = "dev-mode-user"
DEV_USER_EMAIL = "dev@example.com"


def _ensure_dev_mode_allowed() -> None:
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk auth is not configured. Set CLERK_SECRET_KEY, CLERK_JWKS_URL, "
            "and CLERK_ISSUER — dev-mode auth fallback is disabled in production.",
        )


async def _get_or_create_user(db: AsyncSession, clerk_user_id: str, email: str, full_name: str | None = None) -> User:
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(clerk_user_id=clerk_user_id, email=email, full_name=full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Primary auth dependency — protected routes use `Depends(get_current_user)`."""

    if not settings.auth_configured:
        _ensure_dev_mode_allowed()
        return await _get_or_create_user(db, DEV_USER_CLERK_ID, DEV_USER_EMAIL, "Dev User")

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = verify_clerk_token(credentials.credentials)
    except TokenVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    clerk_user_id = claims.get("sub")
    email = claims.get("email") or f"{clerk_user_id}@unknown.clerk"
    full_name = claims.get("name")

    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject claim")

    return await _get_or_create_user(db, clerk_user_id, email, full_name)
