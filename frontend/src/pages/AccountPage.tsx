import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiUsageTable } from "@/components/account/ApiUsageTable";
import { SystemStatusCard } from "@/components/account/SystemStatusCard";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getApiUsage,
  getProfile,
  getSettings,
  getSystemStatus,
  updateSettings,
} from "@/services/userService";

export function AccountPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: profile, isError: profileError } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
  const { data: status, isError: statusError } = useQuery({ queryKey: ["status"], queryFn: getSystemStatus });
  const { data: usage, isError: usageError } = useQuery({ queryKey: ["usage"], queryFn: getApiUsage });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updated) => queryClient.setQueryData(["settings"], updated),
  });

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {profile?.email ?? (profileError ? "Profile unavailable" : "Loading profile...")}
        </p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="status">System status</TabsTrigger>
          <TabsTrigger value="usage">API usage</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {settingsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-4">
                <div>
                  <Label className="text-ink">Dark mode</Label>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Switch between dark and light appearance.
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-4">
                <div>
                  <Label className="text-ink">Preferred LLM provider</Label>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Used as the default for new analyses, if configured on the backend.
                  </p>
                </div>
                <Select
                  value={settings?.preferred_llm_provider ?? "default"}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      preferred_llm_provider: value === "default" ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Server default</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-4">
                <div>
                  <Label className="text-ink">Email notifications</Label>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Get notified when a long-running analysis completes.
                  </p>
                </div>
                <Switch
                  checked={settings?.email_notifications ?? true}
                  onCheckedChange={(checked) => updateMutation.mutate({ email_notifications: checked })}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="status">
          {statusError ? (
            <p className="rounded-md border border-pass-soft bg-pass-soft/20 p-3 text-sm text-pass">Could not load system status.</p>
          ) : status ? (
            <SystemStatusCard status={status} />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </TabsContent>

        <TabsContent value="usage">
          {usageError ? (
            <p className="rounded-md border border-pass-soft bg-pass-soft/20 p-3 text-sm text-pass">Could not load real API usage logs.</p>
          ) : usage ? (
            <ApiUsageTable usage={usage} />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
