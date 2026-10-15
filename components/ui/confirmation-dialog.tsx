"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmationOptions = { title?: string; description: string };

export function useConfirmation() {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolve = useRef<((confirmed: boolean) => void) | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((details: ConfirmationOptions): Promise<boolean> => {
    if (resolve.current) return Promise.resolve(false);
    return new Promise(result => { resolve.current = result; setOptions(details); setOpen(true); });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    const result = resolve.current;
    resolve.current = null;
    setOpen(false);
    result?.(confirmed);
  }, []);

  useEffect(() => () => { resolve.current?.(false); resolve.current = null; }, []);

  const confirmationDialog = (
    <AlertDialog.Root open={open} onOpenChange={next => { if (!next) settle(false); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="modal-backdrop fixed inset-0 z-[80] bg-[#302033]/40 backdrop-blur-sm" />
        <AlertDialog.Popup initialFocus={cancelButton} className="modal-popup fixed top-1/2 left-1/2 z-[80] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#eadfd8] bg-background p-6 shadow-xl outline-none sm:p-7">
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><TriangleAlert className="size-6" aria-hidden="true" /></span>
          <AlertDialog.Title className="text-2xl font-bold tracking-tight">{options?.title ?? "Are you sure?"}</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-7 text-secondary-foreground">{options?.description}</AlertDialog.Description>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button ref={cancelButton} type="button" variant="secondary" onClick={() => settle(false)} className="h-12 rounded-full">No, cancel</Button>
            <Button type="button" onClick={() => settle(true)} className="h-12 rounded-full">Yes</Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirm, confirmationDialog };
}
