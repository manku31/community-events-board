import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign up | Community Events Board",
  description: "Join Community Events Board and discover local experiences.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
