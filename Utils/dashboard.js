import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import { checkModulePermission } from "../MiddleWare/modulePermissionLast.js";

// Dashboard data (need can_view permission)
const router = express.Router();
router.get(
  "/dashboard/data",
  verifyAuth,
  checkModulePermission("dashboard", "can_view"),
  (req, res) => {
    res.json({ message: "Dashboard data for permitted user" });
  }
);

export default router;

// ব্যবহারের নিয়ম (Admin Panel):
// গ্রান্ট: /api/permissions/grant
// POST: { userId, modulePermissions: [{moduleName, canView, canCreate, canEdit, canDelete}], reason, expiresAt }
// রিভোক: /api/permissions/revoke
// POST: { userId, moduleNames: ["dashboard", ...], reason }
// চেক: /api/permissions/user/:userId/effective
// GET: effectivePermissions object পাবেন।
