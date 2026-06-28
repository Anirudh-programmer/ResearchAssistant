import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@/types";

const sentimentVariant = {
  positive: "invest" as const,
  negative: "pass" as const,
  neutral: "default" as const,
};

export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint italic">No recent news found.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-medium leading-snug text-ink">{item.title}</h4>
              {item.sentiment && (
                <Badge variant={sentimentVariant[item.sentiment]} className="shrink-0">
                  {item.sentiment}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
              {item.published_at && <span>{item.published_at}</span>}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  Source <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
