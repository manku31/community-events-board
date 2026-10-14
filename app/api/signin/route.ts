import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { signinWithPassword } from "@/lib/auth/credentials";
import { authFailure, authSuccess, readAuthBody } from "@/lib/auth/http";
import { authFieldErrors, signinSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const parsed = signinSchema.safeParse(await readAuthBody(request));
    if (!parsed.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check your details.", authFieldErrors(parsed.error));
    const { email, password, client } = parsed.data;
    const { user, tokens } = await signinWithPassword(email, password);
    return authSuccess(user, tokens, client, 200, "Signed in");
  } catch (error) { return authFailure(error); }
}
