"""User-account-related business logic: settings, saved companies, API usage stats."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ApiLog, SavedCompany, User, UserSettings


async def get_or_create_settings(db: AsyncSession, user: User) -> UserSettings:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    settings_row = result.scalar_one_or_none()

    if settings_row is None:
        settings_row = UserSettings(user_id=user.id)
        db.add(settings_row)
        await db.commit()
        await db.refresh(settings_row)

    return settings_row


async def update_settings(
    db: AsyncSession,
    user: User,
    theme: str | None = None,
    preferred_llm_provider: str | None = None,
    email_notifications: bool | None = None,
) -> UserSettings:
    settings_row = await get_or_create_settings(db, user)

    if theme is not None:
        settings_row.theme = theme
    if preferred_llm_provider is not None:
        settings_row.preferred_llm_provider = preferred_llm_provider
    if email_notifications is not None:
        settings_row.email_notifications = email_notifications

    await db.commit()
    await db.refresh(settings_row)
    return settings_row


async def list_saved_companies(db: AsyncSession, user_id: str) -> list[SavedCompany]:
    result = await db.execute(
        select(SavedCompany).where(SavedCompany.user_id == user_id).order_by(SavedCompany.created_at.desc())
    )
    return list(result.scalars().all())


async def add_saved_company(
    db: AsyncSession, user_id: str, company_name: str, ticker: str | None, notes: str | None
) -> SavedCompany:
    saved = SavedCompany(user_id=user_id, company_name=company_name, ticker=ticker, notes=notes)
    db.add(saved)
    await db.commit()
    await db.refresh(saved)
    return saved


async def remove_saved_company(db: AsyncSession, saved_company_id: str, user_id: str) -> bool:
    result = await db.execute(
        select(SavedCompany).where(SavedCompany.id == saved_company_id, SavedCompany.user_id == user_id)
    )
    saved = result.scalar_one_or_none()
    if saved is None:
        return False
    await db.delete(saved)
    await db.commit()
    return True


async def get_api_usage_summary(db: AsyncSession, user_id: str) -> list[dict]:
    """Aggregated API usage stats, grouped by provider, for the Profile -> API usage page."""
    providers_result = await db.execute(
        select(ApiLog.provider).where(ApiLog.user_id == user_id).distinct()
    )
    providers = [row[0] for row in providers_result.all()]

    summaries = []
    for provider in providers:
        total_q = await db.execute(
            select(func.count()).select_from(ApiLog).where(ApiLog.user_id == user_id, ApiLog.provider == provider)
        )
        success_q = await db.execute(
            select(func.count())
            .select_from(ApiLog)
            .where(ApiLog.user_id == user_id, ApiLog.provider == provider, ApiLog.success.is_(True))
        )
        avg_latency_q = await db.execute(
            select(func.avg(ApiLog.latency_ms))
            .select_from(ApiLog)
            .where(ApiLog.user_id == user_id, ApiLog.provider == provider, ApiLog.latency_ms.is_not(None))
        )

        total = total_q.scalar_one()
        success = success_q.scalar_one()
        avg_latency = avg_latency_q.scalar_one()

        summaries.append(
            {
                "provider": provider,
                "total_calls": total,
                "success_count": success,
                "failure_count": total - success,
                "avg_latency_ms": round(avg_latency, 1) if avg_latency is not None else None,
            }
        )

    return summaries
