
export function isAdminRole(role: string | null | undefined) {
  if (!role) return false;
  return role === "ADMIN";
}
