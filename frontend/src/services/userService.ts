import { apiFetch } from "@/services/api";
import type { ApiUsageSummary, SavedCompany, SystemStatus, UserProfile, UserSettings } from "@/types";

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/profile");
}

export async function getSettings(): Promise<UserSettings> {
  return apiFetch<UserSettings>("/settings");
}

export async function updateSettings(payload: Partial<UserSettings>): Promise<UserSettings> {
  return apiFetch<UserSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getSavedCompanies(): Promise<SavedCompany[]> {
  return apiFetch<SavedCompany[]>("/saved-companies");
}

export async function addSavedCompany(payload: {
  company_name: string;
  ticker?: string | null;
  notes?: string | null;
}): Promise<SavedCompany> {
  return apiFetch<SavedCompany>("/saved-companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeSavedCompany(id: string): Promise<void> {
  return apiFetch<void>(`/saved-companies/${id}`, { method: "DELETE" });
}

export async function getApiUsage(): Promise<ApiUsageSummary[]> {
  return apiFetch<ApiUsageSummary[]>("/usage");
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return apiFetch<SystemStatus>("/status");
}
