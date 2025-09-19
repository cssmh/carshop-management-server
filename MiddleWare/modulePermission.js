// backend/middleware/modulePermission.js

import { canAccessRoute, hasPermission } from "../Utils/moduleConfig.js";

export const checkModulePermission = (requiredModule) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: "Unauthorized: No role found" });
    }

    if (!hasPermission(userRole, requiredModule)) {
      return res.status(403).json({
        message: `Access denied: You don't have permission to access ${requiredModule}`,
      });
    }

    next();
  };
};

export const checkRoutePermission = () => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const route = req.route?.path || req.path;

    if (!userRole) {
      return res.status(401).json({ message: "Unauthorized: No role found" });
    }

    if (!canAccessRoute(userRole, route)) {
      return res.status(403).json({
        message: `Access denied: You don't have permission to access this route`,
      });
    }

    next();
  };
};
