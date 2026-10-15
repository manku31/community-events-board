import type { ComponentProps } from "react";
import { cn } from "cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} aria-hidden="true" className={cn("rounded-xl bg-[#e9e0eb] motion-safe:animate-pulse", className)} />;
}
