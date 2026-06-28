import { SignOutButton, useUser } from "@clerk/clerk-react";
import {
  Bookmark,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Stamp,
  Sun,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthAvailability } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { getReports } from "@/services/reportService";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/research", label: "New research", icon: Search },
  { to: "/history", label: "History", icon: History },
  { to: "/saved", label: "Saved companies", icon: Bookmark },
  { to: "/account", label: "Account", icon: Settings },
];

function ClerkUserBadge() {
  const { user } = useUser();
  return (
    <>
      <Avatar>
        <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Account"} />
        <AvatarFallback>{(user?.firstName?.[0] ?? "D").toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{user?.fullName ?? "Dev User"}</p>
        <p className="truncate text-xs text-ink-faint">
          {user?.primaryEmailAddress?.emailAddress ?? "dev@example.com"}
        </p>
      </div>
    </>
  );
}

function DevUserBadge() {
  return (
    <>
      <Avatar>
        <AvatarFallback>D</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">Dev User</p>
        <p className="truncate text-xs text-ink-faint">dev@example.com</p>
      </div>
    </>
  );
}

function CompanyAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-surface-raised border border-border text-[10px] font-bold text-ink-muted">
      {initials}
    </div>
  );
}

function getVerdictDetails(verdict: string | null) {
  if (!verdict) return { label: "N/A", colorClass: "text-ink-faint bg-border/20 border-border/40", dot: "⚪" };
  if (verdict === "INVEST") {
    return { label: "INVEST", colorClass: "text-invest bg-invest/10 border-invest/20", dot: "🟢" };
  }
  return { label: "PASS", colorClass: "text-pass bg-pass/10 border-pass/20", dot: "🔴" };
}

function cleanTicker(ticker: string | null) {
  if (!ticker) return "N/A";
  if (ticker.toLowerCase().includes("not resolved") || ticker.length > 8) {
    return "N/A";
  }
  return ticker;
}

export function AppSidebar() {
  const { theme, toggleTheme } = useTheme();
  const { clerkConfigured } = useAuthAvailability();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: reportsData } = useQuery({
    queryKey: ["reports", 1, 5],
    queryFn: () => getReports(1, 5),
  });

  const recentReports = reportsData?.items || [];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <Stamp className="size-5 text-accent" />
        <span className="font-display text-lg font-semibold tracking-tight">Verdict</span>
      </div>

      <nav className="space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-surface-raised text-ink"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Recent Reports Section */}
      <div className="flex-1 border-t border-border px-4 py-4 overflow-y-auto">
        <h3 className="font-display text-xs font-semibold tracking-wider text-ink-faint uppercase mb-3">
          Recent reports
        </h3>

        {recentReports.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center">
            <p className="text-xs font-medium text-ink-muted">No reports yet.</p>
            <p className="mt-1 text-[10px] text-ink-faint leading-relaxed">
              Run your first analysis to see it appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentReports.map((report) => {
              const isActive = location.pathname === `/report/${report.id}`;
              const verdictInfo = getVerdictDetails(report.verdict);

              return (
                <motion.div
                  key={report.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <button
                    onClick={() => navigate(`/report/${report.id}`)}
                    className={cn(
                      "w-full text-left flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors duration-200 cursor-pointer min-w-0",
                      isActive
                        ? "bg-surface-raised border-border-strong"
                        : "bg-surface/50 border-border hover:bg-surface-raised hover:border-border-strong"
                    )}
                  >
                    <CompanyAvatar name={report.company_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 w-full min-w-0">
                        <span className="truncate text-xs font-semibold text-ink leading-none">
                          {report.company_name}
                        </span>
                        <span className="shrink-0 text-[9px] font-mono text-ink-faint uppercase truncate max-w-[60px]">
                          {cleanTicker(report.ticker)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">{verdictInfo.dot}</span>
                          <span className={cn("text-[9px] font-bold tracking-wider uppercase", verdictInfo.colorClass.split(" ")[0])}>
                            {verdictInfo.label}
                          </span>
                        </div>
                        {report.investment_score !== undefined && report.investment_score !== null && (
                          <span className="text-[9px] font-mono text-ink-muted">
                            Score {report.investment_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border/60">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-raised/40 px-3 py-2 text-xs font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <>
                <Moon className="size-3.5 text-accent" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="size-3.5 text-accent" />
                <span>Light Mode</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-ink-faint font-mono uppercase bg-border px-1.5 py-0.5 rounded">
            {theme}
          </span>
        </button>
      </div>

      <div className="border-t border-border px-4 py-3">
        {clerkConfigured ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left focus:outline-none">
              <div className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface-raised transition-colors cursor-pointer">
                <ClerkUserBadge />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <SignOutButton>
                <DropdownMenuItem className="cursor-pointer text-pass hover:text-pass-strong">
                  <LogOut className="mr-2 size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 p-1.5">
            <DevUserBadge />
          </div>
        )}
      </div>
    </aside>
  );
}
