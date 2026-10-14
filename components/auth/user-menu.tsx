"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { LoaderCircle, LogOut, UserRound } from "lucide-react";
import { clearAccessToken } from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth/types";
import type { ApiResponse } from "@/lib/api/types";

export function UserMenu({ user }: { user: AuthUser }) {
  const pending = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (pending.current) return;
    pending.current = true;
    setIsLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      const body: ApiResponse<null> = await response.json();
      if (!response.ok || !body.success) {
        setError(!body.success ? body.error.message : "We couldn’t log you out. Please try again.");
        return;
      }
      clearAccessToken();
      window.location.replace("/");
    } catch {
      setError("We couldn’t connect. Please try logging out again.");
    } finally {
      pending.current = false;
      setIsLoggingOut(false);
    }
  }

  const itemClass = "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none data-[highlighted]:bg-secondary/70 data-[highlighted]:text-secondary-foreground";

  return (
    <div className="relative size-12 shrink-0">
    <Menu.Root open={isOpen} onOpenChange={setIsOpen}>
      <Menu.Trigger aria-label={isOpen ? "Close user menu" : "Open user menu"} data-open={isOpen} className="user-island-trigger focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <span className="user-island-avatar" aria-hidden="true"><UserRound className="size-[22px]" strokeWidth={1.8} /></span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={16} className="z-50">
          <Menu.Popup className="user-island-panel outline-none">
            <div className="user-island-content">
              <div className="mb-2 flex min-w-0 items-center gap-3 rounded-2xl bg-secondary/70 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white font-semibold text-secondary-foreground" aria-hidden="true">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name || user.email.split("@")[0]}</p>
                  <p className="mt-0.5 truncate text-xs text-[#756477]" title={user.email}>{user.email}</p>
                </div>
              </div>
            <Menu.LinkItem render={<Link href="/profile" />} closeOnClick className={`${itemClass} mt-1`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-secondary-foreground"><UserRound className="size-4" aria-hidden="true" /></span> My profile
            </Menu.LinkItem>
            <Menu.Item onClick={logout} disabled={isLoggingOut} closeOnClick={false} className={`${itemClass} text-primary data-[disabled]:cursor-wait data-[disabled]:opacity-60`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">{isLoggingOut ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}</span>
              {isLoggingOut ? "Logging out…" : "Log out"}
            </Menu.Item>
            {error && <p role="alert" className="px-3 py-2 text-sm leading-6 text-destructive">{error}</p>}
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
    </div>
  );
}
