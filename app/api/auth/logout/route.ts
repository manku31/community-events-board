import { withAuth } from "@/lib/server/auth/middleware";
import { logOut } from "@/lib/server/auth/service";
import { MESSAGES } from "@/lib/server/errors";

export const POST = withAuth(async (_request, auth) => {
  await logOut(auth.sessionId);
  return Response.json({ data: { message: MESSAGES.signedOut } });
});
