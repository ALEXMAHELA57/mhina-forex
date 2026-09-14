/**
 * Gate for moderator/admin/super_admin-only routes.
 * Use after requireAuth so req.profile is populated.
 */
export function requireStaff(req, res, next) {
  if (!req.profile || !['moderator', 'admin', 'super_admin'].includes(req.profile.role)) {
    return res.status(403).json({ error: 'Staff role required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.profile || !['admin', 'super_admin'].includes(req.profile.role)) {
    return res.status(403).json({ error: 'Admin role required' });
  }
  next();
}
