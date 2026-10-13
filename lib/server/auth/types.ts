export type Role = "USER" | "ADMIN";

export type UserRow = {
  id: string;
  email: string;
  role: Role;
  created_at: Date;
};

export function publicUser(user: UserRow) {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.created_at.toISOString() };
}

export type AuthContext = {
  user: ReturnType<typeof publicUser>;
  sessionId: string;
};
