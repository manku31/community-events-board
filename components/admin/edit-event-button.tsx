"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

export function EditEventButton() {
  const [showMessage, setShowMessage] = useState(false);
  return (
    <div className="w-full shrink-0 lg:w-56">
      <button type="button" onClick={() => setShowMessage(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><Pencil className="size-4" aria-hidden="true" /> Edit event</button>
      {showMessage && <p role="status" className="mt-3 text-xs leading-6 text-secondary-foreground">Event editing will be connected in the next step.</p>}
    </div>
  );
}
