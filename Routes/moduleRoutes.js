// backend/routes/moduleRoutes.js
import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import { checkModulePermission } from "../MiddleWare/modulePermission.js";
import {
  getUserModules,
  checkUserPermission,
} from "../Controllers/moduleController.js";

const router = express.Router();

// Get user's available modules
router.get("/modules", verifyAuth, getUserModules);

// Check specific permission
router.get("/permission/:module/:action", verifyAuth, checkUserPermission);

// Protected routes with module permission checks
router.get(
  "/dashboard/data",
  verifyAuth,
  checkModulePermission("dashboard"),
  (req, res) => {
    res.json({ message: "Dashboard data" });
  }
);

router.get(
  "/customers",
  verifyAuth,
  checkModulePermission("customers"),
  (req, res) => {
    res.json({ message: "Customers data" });
  }
);

router.post(
  "/customers",
  verifyAuth,
  checkModulePermission("customers"),
  (req, res) => {
    // Additional check for create permission
    // This would need to be implemented in the middleware
    res.json({ message: "Customer created" });
  }
);

export default router;
