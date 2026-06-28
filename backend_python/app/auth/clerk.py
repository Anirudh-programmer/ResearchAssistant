"""
Clerk JWT verification.

Verifies the bearer token sent by the frontend (Clerk session token) against
Clerk's public JWKS — no Clerk secret key needed for verification itself,
just the JWKS URL + issuer, both public-safe values from your Clerk dashboard.

JWKS keys are cached in-process and refreshed only when a token's `kid`
isn't found in the cache (handles Clerk's occasional key rotation) instead
of fetching on every request.
"""
import time

import httpx
import jwt
from jwt import PyJWKClient

from app.config import get_settings

settings = get_settings()

_jwk_client: PyJWKClient | None = None
_jwk_client_created_at: float = 0.0
_JWK_CLIENT_TTL_SECONDS = 3600  # rebuild the client hourly to pick up key rotation


class TokenVerificationError(Exception):
    """Raised when a bearer token fails verification for any reason."""


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client, _jwk_client_created_at

    if not settings.clerk_jwks_url:
        raise TokenVerificationError("CLERK_JWKS_URL is not configured")

    now = time.time()
    if _jwk_client is None or (now - _jwk_client_created_at) > _JWK_CLIENT_TTL_SECONDS:
        _jwk_client = PyJWKClient(settings.clerk_jwks_url, cache_keys=True)
        _jwk_client_created_at = now

    return _jwk_client


def verify_clerk_token(token: str) -> dict:
    """
    Verifies a Clerk session JWT and returns its decoded claims.

    Raises TokenVerificationError on any failure (expired, bad signature,
    wrong issuer, etc.) — callers should catch this and respond 401.
    """
    if not settings.auth_configured:
        raise TokenVerificationError("Clerk auth is not configured on this server")

    try:
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            options={"verify_aud": False},  # Clerk session tokens don't set `aud` by default
        )
        return claims
    except jwt.ExpiredSignatureError as exc:
        raise TokenVerificationError("Token has expired") from exc
    except jwt.InvalidIssuerError as exc:
        raise TokenVerificationError("Token issuer does not match this application") from exc
    except jwt.PyJWTError as exc:
        raise TokenVerificationError(f"Token verification failed: {exc}") from exc
    except httpx.HTTPError as exc:
        raise TokenVerificationError(f"Could not fetch JWKS: {exc}") from exc
