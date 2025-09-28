import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  grantUserPermission,
  revokeUserPermission,
  getUserEffectivePermissions,
} from "../controllers/permissionController.js";

const router = express.Router();

router.post("/grant", verifyAuth, grantUserPermission); // POST: { userId, modulePermissions }
router.post("/revoke", verifyAuth, revokeUserPermission); // POST: { userId, moduleNames }
router.get("/user/:userId/effective", verifyAuth, getUserEffectivePermissions);

export default router;
