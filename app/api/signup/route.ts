import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { signupWithPassword } from "@/lib/auth/credentials";
import { authFailure, authSuccess, readAuthBody } from "@/lib/auth/http";
import { authFieldErrors, signupSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const parsed = signupSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check your details.", authFieldErrors(parsed.error));
    const { name, email, password, client } = parsed.data;
    const { user, tokens } = await signupWithPassword(name, email, password);
    return authSuccess(user, tokens, client, 201, "Account created");
  } catch (error) { return authFailure(error); }
}
