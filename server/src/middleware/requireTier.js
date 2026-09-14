const TIER_RANK = { free: 0, pro: 1, vip: 2 };

/**
 * Gate for VIP/Pro-only routes (signals, live sessions, courses, etc.).
 * Mirrors the meets_required_tier() logic enforced by Postgres RLS —
 * this is the API-layer check; RLS is the last line of defense underneath it.
 * Use after requireAuth so req.profile is populated.
 */
export function requireTier(requiredTier) {
  return (req, res, next) => {
    const profile = req.profile;

    if (!profile || profile.access_status !== 'active') {
      return res.status(403).json({
        error: 'Access requires Headway verification or an active paid membership',
      });
    }

    const userRank = TIER_RANK[profile.membership_tier] ?? 0;
    const requiredRank = TIER_RANK[requiredTier] ?? 0;

    if (userRank < requiredRank) {
      return res.status(403).json({
        error: `This content requires ${requiredTier.toUpperCase()} tier or above`,
      });
    }

    next();
  };
}
