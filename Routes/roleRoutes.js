import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  createRole,
  listRoles,
  getRole,
  updateRole,
  deleteRole,
  getRoleStats,
} from "../controllers/roleController.js";

const router = express.Router();

// Role management (admin and above only)
const adminOnly = (req, res, next) => {
  if (!["global", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Access denied: Admin privileges required",
    });
  }
  next();
};

router.post("/roles", verifyAuth, adminOnly, createRole);
router.get("/roles", verifyAuth, adminOnly, listRoles);
router.get("/roles/stats", verifyAuth, adminOnly, getRoleStats);
router.get("/roles/:id", verifyAuth, adminOnly, getRole);
router.put("/roles/:id", verifyAuth, adminOnly, updateRole);
router.delete("/roles/:id", verifyAuth, adminOnly, deleteRole);

export default router;
