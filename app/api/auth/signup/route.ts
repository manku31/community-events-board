import { api, jsonBody } from "@/lib/server/http";
import { credentialsSchema } from "@/lib/server/auth/validation";
import { signUp } from "@/lib/server/auth/service";

export const POST = api(async (request) => {
  const credentials = await jsonBody(request, credentialsSchema);
  return Response.json({ data: await signUp(credentials) }, { status: 201 });
});
