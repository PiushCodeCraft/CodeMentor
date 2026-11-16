/**
 * Middleware to restrict route access by role
 * @param  {...string} roles Allowed roles ('student', 'mentor', 'admin')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}.`,
      });
    }

    next();
  };
};

