import { SignOutButton, useUser } from "@clerk/clerk-react";
import { LogOut, Menu, Moon, Stamp, Sun } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthAvailability } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/research", label: "New research" },
  { to: "/history", label: "History" },
  { to: "/saved", label: "Saved" },
  { to: "/account", label: "Account" },
];

function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
        <Menu className="size-5" />
      </Button>
      {open && (
        <nav className="absolute left-0 right-0 top-16 z-40 flex flex-col gap-1 border-b border-border bg-surface p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-surface-raised text-ink" : "text-ink-muted hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

function ClerkUserMenu() {
  const { user } = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {user?.firstName ?? "Account"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <SignOutButton>
          <DropdownMenuItem>
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { clerkConfigured } = useAuthAvailability();

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Stamp className="size-5 text-accent" />
        <span className="font-display text-base font-semibold">Verdict</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        {clerkConfigured ? <ClerkUserMenu /> : (
          <span className="text-sm text-ink-faint">Dev mode</span>
        )}
        <MobileMenu />
      </div>
    </header>
  );
}
