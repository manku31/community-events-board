"use client";

import { useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Eye, EyeOff, LoaderCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResponse, FieldErrors } from "@/lib/api/types";
import type { AuthUser } from "@/lib/auth/types";
import { authFieldErrors, createAdminSchema } from "@/lib/validation/auth";

export function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const pending = useRef(false);
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function changeOpen(next: boolean) {
    if (pending.current) return;
    if (!next) {
      setValues({ name: "", email: "", password: "" });
      setErrors({});
      setMessage("");
      setCreated(false);
      setShowPassword(false);
    }
    onOpenChange(next);
  }

  function showErrors(details: FieldErrors) {
    setErrors(details);
    const field = ["name", "email", "password"].find(key => details[key]?.length);
    const input = field && formRef.current?.elements.namedItem(field);
    if (input instanceof HTMLInputElement) input.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || created) return;
    setMessage("");
    const parsed = createAdminSchema.safeParse(values);
    if (!parsed.success) { showErrors(authFieldErrors(parsed.error)); return; }
    pending.current = true;
    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      const body: ApiResponse<{ user: AuthUser }> = await response.json();
      if (!response.ok || !body.success) {
        if (!body.success) {
          if (body.error.details) showErrors(body.error.details);
          setMessage(body.error.message);
        } else setMessage("We couldn’t create this account. Please try again.");
        return;
      }
      setValues({ name: "", email: "", password: "" });
      setCreated(true);
      setMessage(`${body.data.user.name}’s admin account is ready. They can now sign in.`);
    } catch {
      setMessage("We couldn’t connect. Please check your connection and try again.");
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClass = "mt-2 h-12 w-full min-w-0 rounded-2xl border border-[#dfd4df] bg-white px-4 text-base outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 aria-invalid:border-destructive disabled:opacity-60";

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#302033]/35 backdrop-blur-sm transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#eadfd8] bg-background p-5 shadow-xl outline-none transition-[opacity,scale] duration-200 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none sm:p-8">
          <Dialog.Close disabled={isSubmitting} aria-label="Close add user" className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"><X className="size-5" aria-hidden="true" /></Dialog.Close>
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><UserPlus className="size-6" aria-hidden="true" /></span>
          <Dialog.Title className="pr-8 text-2xl font-bold tracking-tight">Add user</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-[#6c5c70]">Create an admin account to help manage your community events.</Dialog.Description>
          {created ? (
            <div className="mt-6">
              <p role="status" className="rounded-2xl bg-secondary p-4 text-sm leading-7 text-secondary-foreground">{message}</p>
              <Button onClick={() => changeOpen(false)} className="mt-5 h-12 w-full rounded-full">Done</Button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={isSubmitting} className="mt-6 space-y-5">
              {(["name", "email", "password"] as const).map(field => (
                <div key={field}>
                  <label htmlFor={`add-user-${field}`} className="text-sm font-semibold">{field === "name" ? "Name" : field === "email" ? "Email address" : "Password"}</label>
                  <div className="relative">
                    <input id={`add-user-${field}`} name={field} type={field === "password" ? (showPassword ? "text" : "password") : field === "email" ? "email" : "text"} autoComplete={field === "password" ? "new-password" : "off"} autoCapitalize={field === "name" ? "words" : "none"} spellCheck={false} required maxLength={field === "name" ? 100 : field === "email" ? 254 : 128} disabled={isSubmitting} aria-invalid={Boolean(errors[field]?.length)} aria-describedby={errors[field]?.length ? `add-user-${field}-error` : undefined} className={`${inputClass} ${field === "password" ? "pr-14" : ""}`} value={values[field]} onChange={event => { setValues(current => ({ ...current, [field]: event.target.value })); setErrors(current => ({ ...current, [field]: [] })); setMessage(""); }} />
                    {field === "password" && <button type="button" disabled={isSubmitting} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(current => !current)} className="absolute right-0.5 bottom-0.5 flex size-11 items-center justify-center rounded-xl text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}</button>}
                  </div>
                  {errors[field]?.[0] && <p id={`add-user-${field}-error`} role="alert" className="mt-2 text-sm leading-6 text-destructive">{errors[field][0]}</p>}
                </div>
              ))}
              {message && <p role="alert" className="rounded-xl bg-secondary p-4 text-sm leading-6 text-secondary-foreground">{message}</p>}
              <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-full">{isSubmitting ? <><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> Creating user…</> : "Create user"}</Button>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
