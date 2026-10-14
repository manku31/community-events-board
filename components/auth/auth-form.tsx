"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiResponse, FieldErrors } from "@/lib/api/types";
import type { AuthResult } from "@/lib/auth/types";
import { storeAccessToken } from "@/lib/auth/client";
import { authFieldErrors, signinSchema, signupFormSchema } from "@/lib/validation/auth";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: string) {
    setFieldErrors(current => ({ ...current, [field]: [] }));
    setMessage("");
  }

  function showErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    const firstField = ["name", "email", "password", "confirmPassword"].find(field => errors[field]?.length);
    const input = firstField && formRef.current?.elements.namedItem(firstField);
    if (input instanceof HTMLInputElement) input.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setMessage("");
    const values = isSignup ? { name, email, password, confirmPassword } : { email, password };
    const parsed = (isSignup ? signupFormSchema : signinSchema).safeParse(values);
    if (!parsed.success) {
      showErrors(authFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch(isSignup ? "/api/signup" : "/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(parsed.data),
      });
      const body: ApiResponse<AuthResult> = await response.json();
      if (!response.ok || !body.success) {
        if (!body.success) {
          if (body.error.details) showErrors(body.error.details);
          setMessage(body.error.message);
        } else setMessage("We couldn’t complete your request. Please try again.");
        return;
      }
      storeAccessToken(body.data.accessToken);
      setPassword("");
      setConfirmPassword("");
      // Start the new session with one fresh navigation and no stale router cache.
      window.location.replace("/home");
    } catch {
      setMessage("We couldn’t connect. Please check your connection and try again.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  const inputClassName = "mt-2 h-12 w-full min-w-0 rounded-2xl border border-[#dfd4df] bg-white px-4 text-base outline-none placeholder:text-[#8c7b91] focus:border-primary focus:ring-3 focus:ring-primary/15 aria-invalid:border-destructive disabled:opacity-60";
  const toggleClassName = "absolute right-0.5 bottom-0.5 flex size-11 items-center justify-center rounded-lg text-[#6c5c70] hover:bg-background focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60";

  function fieldError(field: string) {
    return fieldErrors[field]?.[0] && <p id={`${field}-error`} role="alert" className="mt-2 text-sm leading-6 text-destructive">{fieldErrors[field][0]}</p>;
  }

  return (
    <section className="rounded-3xl border border-[#eadfd8] bg-white p-5 shadow-[0_8px_0_#f0e5dc] sm:rounded-[2rem] sm:p-8">
      <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Smile className="size-6" aria-hidden="true" /></span>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{isSignup ? "Join the good times." : "Hey, welcome back!"}</h1>
      <p className="mt-3 text-sm leading-7 text-[#6c5c70]">{isSignup ? "Create an account and find more of what makes you happy." : "Sign in to find your favourites and make a few new plans."}</p>

      <form ref={formRef} className="mt-6 space-y-5 sm:mt-8" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        {isSignup && (
          <div>
            <label htmlFor="name" className="text-sm font-semibold">Name</label>
            <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" required maxLength={100} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.name?.length)} aria-describedby={fieldErrors.name?.length ? "name-error" : undefined} className={inputClassName} value={name} onChange={event => { setName(event.target.value); clearError("name"); }} />
            {fieldError("name")}
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" required maxLength={254} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.email?.length)} aria-describedby={fieldErrors.email?.length ? "email-error" : undefined} className={inputClassName} value={email} onChange={event => { setEmail(event.target.value); clearError("email"); }} />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "Create a password" : "Enter your password"} required maxLength={128} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.password?.length)} aria-describedby={fieldErrors.password?.length ? "password-error" : undefined} className={`${inputClassName} pr-14`} value={password} onChange={event => { setPassword(event.target.value); clearError("password"); clearError("confirmPassword"); }} />
            <button type="button" disabled={isSubmitting} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className={toggleClassName}>
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {fieldError("password")}
        </div>
        {isSignup && (
          <div>
            <label htmlFor="confirm-password" className="text-sm font-semibold">Confirm password</label>
            <div className="relative">
              <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" required maxLength={128} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.confirmPassword?.length)} aria-describedby={fieldErrors.confirmPassword?.length ? "confirmPassword-error" : undefined} className={`${inputClassName} pr-14`} value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); clearError("confirmPassword"); }} />
              <button type="button" disabled={isSubmitting} onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} aria-pressed={showConfirmPassword} className={toggleClassName}>
                {showConfirmPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
              </button>
            </div>
            {fieldError("confirmPassword")}
          </div>
        )}
        <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-full bg-primary text-white hover:bg-primary/90">
          {isSubmitting ? <><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> {isSignup ? "Creating account…" : "Signing in…"}</> : <>{isSignup ? "Create account" : "Sign in"} <ArrowRight className="size-4" aria-hidden="true" /></>}
        </Button>
        {message && <p role="alert" className="rounded-xl bg-secondary p-4 text-sm leading-6 text-secondary-foreground">{message}</p>}
      </form>

      <p className="mt-6 text-center text-sm leading-7 text-[#6c5c70]">
        {isSignup ? "Already part of the community? " : "New around here? "}
        <Link href={isSignup ? "/signin" : "/signup"} className="inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
    </section>
  );
}
