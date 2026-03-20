export const ROLES = {
  ADMIN: 'admin',
  CHILD: 'child'
}

export function hasPermission(allowRoles, currentRole) {
  if (!allowRoles || allowRoles.length === 0) return true
  return allowRoles.includes(currentRole)
}
