import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { addSavedCompany, getSavedCompanies, removeSavedCompany } from "@/services/userService";

const schema = z.object({
  company_name: z.string().trim().min(1, "Required"),
  ticker: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

export function SavedCompaniesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: companies, isLoading, isError, error } = useQuery({
    queryKey: ["saved-companies"],
    queryFn: getSavedCompanies,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const addMutation = useMutation({
    mutationFn: addSavedCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-companies"] });
      reset();
      setDialogOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeSavedCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-companies"] }),
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Saved companies
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Bookmarks for quick re-analysis.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent">
              <Plus className="size-4" /> Add company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save a company</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) =>
                addMutation.mutate({
                  company_name: values.company_name,
                  ticker: values.ticker || null,
                  notes: values.notes || null,
                }),
              )}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company name</Label>
                <Input id="company_name" {...register("company_name")} placeholder="e.g. Apple" />
                {errors.company_name && <p className="text-xs text-pass">{errors.company_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticker">Ticker (optional)</Label>
                <Input id="ticker" {...register("ticker")} placeholder="e.g. AAPL" />
                {errors.ticker && <p className="text-xs text-pass">{errors.ticker.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" {...register("notes")} placeholder="Why are you watching this one?" />
                {errors.notes && <p className="text-xs text-pass">{errors.notes.message}</p>}
              </div>
              {addMutation.isError && (
                <p className="text-sm text-pass">{(addMutation.error as Error)?.message || "Could not save company."}</p>
              )}
              <DialogFooter>
                <Button type="submit" variant="accent" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading...</p>}

      {isError && (
        <p className="rounded-md border border-pass-soft bg-pass-soft/20 p-3 text-sm text-pass">
          {(error as Error)?.message || "Could not load saved companies."}
        </p>
      )}

      {removeMutation.isError && (
        <p className="mb-3 rounded-md border border-pass-soft bg-pass-soft/20 p-3 text-sm text-pass">
          {(removeMutation.error as Error)?.message || "Could not remove saved company."}
        </p>
      )}

      {!isLoading && !isError && (companies?.length ?? 0) === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved companies"
          description="Bookmark companies you want to keep an eye on for quick re-analysis later."
        />
      )}

      {!isLoading && !isError && companies && companies.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{c.company_name}</p>
                    {c.ticker && <span className="data-figure text-xs text-ink-faint">{c.ticker}</span>}
                  </div>
                  {c.notes && <p className="mt-1 text-xs text-ink-muted">{c.notes}</p>}
                  {c.source === "report" && !c.notes && (
                    <p className="mt-1 text-xs text-ink-faint">Saved from report</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Analyze"
                    onClick={() => navigate("/research", { state: { companyName: c.company_name, autoRun: true } })}
                  >
                    <Search className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    onClick={() => removeMutation.mutate(c.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
