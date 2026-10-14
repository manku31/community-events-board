import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { issueAuthTokens } from "./session";

const publicUser = { id: true, email: true, role: true } as const;

export async function signupWithPassword(email: string, password: string) {
  const hashed = await hashPassword(password);
  try {
    return await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { email, password: hashed, role: "user" }, select: publicUser });
      const tokens = await issueAuthTokens(user.id, tx);
      return { user, tokens };
    }, { timeout: 20_000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists. Please sign in.", { email: ["This email is already registered."] });
    }
    throw error;
  }
}

export async function signinWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!(await verifyPassword(password, user?.password)) || !user || !user.status) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const tokens = await issueAuthTokens(user.id);
  return { user: { id: user.id, email: user.email, role: user.role }, tokens };
}
