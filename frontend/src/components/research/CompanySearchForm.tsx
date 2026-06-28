import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters")
    .max(200, "That's a bit long for a company name"),
});

type FormValues = z.infer<typeof schema>;

interface CompanySearchFormProps {
  onSubmit: (companyName: string) => void;
  disabled?: boolean;
  defaultValue?: string;
}

export function CompanySearchForm({ onSubmit, disabled, defaultValue }: CompanySearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: defaultValue ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.companyName))}
      className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
    >
      <div className="flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            {...register("companyName")}
            placeholder="e.g. Tesla, Stripe, Nvidia"
            className="h-12 pl-10 text-base"
            disabled={disabled}
            autoFocus
          />
        </div>
        {errors.companyName && (
          <p className="mt-1.5 text-xs text-pass">{errors.companyName.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" variant="accent" disabled={disabled} className="sm:h-12">
        {disabled ? "Analyzing…" : "Analyze"}
      </Button>
    </form>
  );
}
