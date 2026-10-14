import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in | Community Events Board",
  description: "Sign in to your Community Events Board account.",
};

export default function SignInPage() {
  return <AuthForm mode="signin" />;
}
