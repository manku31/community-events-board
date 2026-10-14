export type AuthUser = { id: number; name: string; email: string; role: string };
export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken?: string;
};
