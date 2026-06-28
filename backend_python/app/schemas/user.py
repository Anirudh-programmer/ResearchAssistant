from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserProfile(BaseModel):
    id: str
    clerk_user_id: str
    email: EmailStr
    full_name: str | None
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSettingsResponse(BaseModel):
    theme: str
    preferred_llm_provider: str | None
    email_notifications: bool

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    theme: str | None = None
    preferred_llm_provider: str | None = None
    email_notifications: bool | None = None


class SavedCompanyCreate(BaseModel):
    company_name: str
    ticker: str | None = None
    notes: str | None = None


class SavedCompanyResponse(BaseModel):
    id: str
    company_name: str
    ticker: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiUsageSummary(BaseModel):
    provider: str
    total_calls: int
    success_count: int
    failure_count: int
    avg_latency_ms: float | None
