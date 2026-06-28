"""
Integration tests against the FastAPI app, using the dev-mode auth fallback
(no Clerk keys configured in the test environment) and an isolated in-memory DB.
"""
import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_system_status_reports_provider_availability(client):
    response = await client.get("/api/v1/status")
    assert response.status_code == 200
    body = response.json()
    assert "llm_providers" in body
    assert "research_tools" in body
    assert set(body["llm_providers"].keys()) == {"gemini", "openai", "anthropic"}


@pytest.mark.asyncio
async def test_profile_dev_mode_autocreates_user(client):
    response = await client.get("/api/v1/profile")
    assert response.status_code == 200
    body = response.json()
    assert body["clerk_user_id"] == "dev-mode-user"
    assert body["email"] == "dev@example.com"


@pytest.mark.asyncio
async def test_empty_reports_list_for_new_user(client):
    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_create_and_fetch_saved_company(client):
    create_resp = await client.post(
        "/api/v1/saved-companies",
        json={"company_name": "Apple", "ticker": "AAPL", "notes": "watching"},
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["company_name"] == "Apple"

    list_resp = await client.get("/api/v1/saved-companies")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["ticker"] == "AAPL"


@pytest.mark.asyncio
async def test_delete_nonexistent_saved_company_returns_404(client):
    response = await client.delete("/api/v1/saved-companies/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_report_returns_404(client):
    response = await client.get("/api/v1/report/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_settings_get_and_update(client):
    get_resp = await client.get("/api/v1/settings")
    assert get_resp.status_code == 200
    assert get_resp.json()["theme"] == "dark"

    patch_resp = await client.patch("/api/v1/settings", json={"theme": "light"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["theme"] == "light"


@pytest.mark.asyncio
async def test_analyze_without_llm_provider_returns_failed_report(client):
    """
    With zero LLM keys configured in the test env, /analyze should still
    return 200 with a report in FAILED status and a clear error_message —
    never a 500 or unhandled exception, per the 'no crashes' requirement.
    """
    response = await client.post("/api/v1/analyze", json={"company_name": "Tesla"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "failed"
    assert body["error_message"] is not None
