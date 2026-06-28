"""Profile, settings, saved companies, and API usage — powers the account pages."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.user import (
    ApiUsageSummary,
    SavedCompanyCreate,
    SavedCompanyResponse,
    UserProfile,
    UserSettingsResponse,
    UserSettingsUpdate,
)
from app.services import (
    add_saved_company,
    get_api_usage_summary,
    get_or_create_settings,
    list_saved_companies,
    remove_saved_company,
    update_settings,
)

router = APIRouter(tags=["account"])


@router.get("/profile", response_model=UserProfile)
async def get_profile(user: User = Depends(get_current_user)) -> UserProfile:
    return UserProfile.model_validate(user)


@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings_route(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> UserSettingsResponse:
    settings_row = await get_or_create_settings(db, user)
    return UserSettingsResponse.model_validate(settings_row)


@router.patch("/settings", response_model=UserSettingsResponse)
async def update_settings_route(
    payload: UserSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserSettingsResponse:
    settings_row = await update_settings(
        db,
        user,
        theme=payload.theme,
        preferred_llm_provider=payload.preferred_llm_provider,
        email_notifications=payload.email_notifications,
    )
    return UserSettingsResponse.model_validate(settings_row)


@router.get("/saved-companies", response_model=list[SavedCompanyResponse])
async def get_saved_companies(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[SavedCompanyResponse]:
    saved = await list_saved_companies(db, user.id)
    return [SavedCompanyResponse.model_validate(s) for s in saved]


@router.post("/saved-companies", response_model=SavedCompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_saved_company(
    payload: SavedCompanyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedCompanyResponse:
    saved = await add_saved_company(db, user.id, payload.company_name, payload.ticker, payload.notes)
    return SavedCompanyResponse.model_validate(saved)


@router.delete("/saved-companies/{saved_company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_company(
    saved_company_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    deleted = await remove_saved_company(db, saved_company_id, user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved company not found")


@router.get("/usage", response_model=list[ApiUsageSummary])
async def get_usage(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ApiUsageSummary]:
    summary = await get_api_usage_summary(db, user.id)
    return [ApiUsageSummary(**row) for row in summary]
