// server/utils/permissions.js
//
// Permission evaluation, in priority order:
//  1. If the user has roles loaded from DB (req.user.roles → Role.permissions),
//     AND any of those permissions match, return true.
//  2. Fall back to ROLE_CAPS[user.role] — the legacy hard-coded map.
//
// Both share the same wildcard syntax: "*", "resource:*", "resource:action".

const ROLE_CAPS = {
  Owner:      ["*"],
  Admin:      ["client:*", "quote:*", "invoice:*", "payment:*", "report:*", "user:*"],
  Manager:    ["client:read", "client:create", "client:assign", "quote:*", "invoice:*", "payment:read", "report:*"],
  Technician: ["client:read", "request:*", "quote:read", "report:read"],
  Finance:    ["client:read", "invoice:*", "payment:*", "report:read"],
  Client:     ["client:read:self", "quote:read:self", "invoice:read:self", "payment:read:self"],
};

function matches(permission, capability) {
  if (!permission) return false;
  if (permission === "*") return true;
  if (permission === capability) return true;
  if (permission.endsWith(":*")) {
    const prefix = permission.slice(0, -1); // "client:" or "quote:"
    return capability.startsWith(prefix) || capability === permission.slice(0, -2);
  }
  return false;
}

function capsFromUserRoles(user) {
  // populated as [{ role: { permissions: ["..."] } }, ...]
  if (!user || !Array.isArray(user.roles)) return null;
  const caps = [];
  for (const ur of user.roles) {
    if (ur?.role?.permissions) caps.push(...ur.role.permissions);
  }
  return caps;
}

function can(user, capability) {
  if (!user) return false;

  // 1. DB-driven roles win
  const dbCaps = capsFromUserRoles(user);
  if (dbCaps && dbCaps.length && dbCaps.some((p) => matches(p, capability))) {
    return true;
  }

  // 2. Legacy map fallback
  const legacy = ROLE_CAPS[user.role] || [];
  return legacy.some((p) => matches(p, capability));
}

module.exports = { can, ROLE_CAPS };