"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

export function EventCover({ image, title }: { image: string; title: string }) {
  const [failed, setFailed] = useState(false);
  let valid = false;
  try { valid = ["https:", "http:"].includes(new URL(image).protocol); } catch { /* Fall back to the illustrated cover. */ }
  return <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-secondary">
    {valid && !failed ? <Image src={image} alt={title} fill unoptimized sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" onError={() => setFailed(true)} referrerPolicy="no-referrer" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 motion-reduce:transition-none" /> : <><span aria-hidden="true" className="absolute -top-10 -right-8 size-36 rounded-full border-[24px] border-[#d9c4e4]" /><ImageIcon aria-hidden="true" className="size-10 text-secondary-foreground/60" /><span className="sr-only">Event image unavailable</span></>}
  </div>;
}
