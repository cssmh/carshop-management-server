// backend/routes/permissionRoutes.js
import express from "express";

import {
  grantUserPermission,
  revokeUserPermission,
  getUserPermissions,
  getAllUsersWithPermissions,
} from "../controllers/permissionController.js";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";

const router = express.Router();

// Only global and admin can manage permissions
const adminOnly = (req, res, next) => {
  if (!["global", "admin"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Access denied: Admin privileges required" });
  }
  next();
};

router.get("/users", verifyAuth, adminOnly, getAllUsersWithPermissions);
router.get("/user/:userId", verifyAuth, adminOnly, getUserPermissions);
router.post("/grant", verifyAuth, adminOnly, grantUserPermission);
router.post("/revoke", verifyAuth, adminOnly, revokeUserPermission);

export default router;
