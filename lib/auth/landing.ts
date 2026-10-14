export function getUserLandingPath(user: { role: string }) {
  return user.role === "admin" ? "/admin" : "/home";
}
