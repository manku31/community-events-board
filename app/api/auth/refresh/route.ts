import { api, jsonBody } from "@/lib/server/http";
import { refreshSchema } from "@/lib/server/auth/validation";
import { refreshTokens } from "@/lib/server/auth/service";

export const POST = api(async (request) => {
  const { refreshToken } = await jsonBody(request, refreshSchema);
  return Response.json({ data: await refreshTokens(refreshToken) });
});
