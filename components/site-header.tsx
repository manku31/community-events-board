import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { AuthUser } from "@/lib/auth/types";
import { UserMenu } from "@/components/auth/user-menu";
import { getUserLandingPath } from "@/lib/auth/landing";

const headerButtonClass = "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-[#a3372c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-6";

export function SiteHeader({ auth = false, user }: { auth?: boolean; user?: AuthUser }) {
  return (
    <header className="border-b border-[#eadfd8] bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <Link href={user ? getUserLandingPath(user) : "/"} className="flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="Community Events Board home">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <CalendarDays className="size-5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-semibold leading-tight sm:text-base">Community<br />Events Board</span>
        </Link>
        {user ? (
          <div className="flex min-w-0 items-center gap-3">
            <UserMenu user={user} />
          </div>
        ) : auth ? (
          <Link href="/" className={headerButtonClass}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back home
          </Link>
        ) : (
          <nav aria-label="Main navigation">
            <Link href="/signin" className={headerButtonClass}>
              Join now
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
