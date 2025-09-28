import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  createTenant,
  listTenants,
  getTenant,
  updateTenant,
  deleteTenant,
} from "../controllers/tenantController.js";

const router = express.Router();

// Only global users can manage tenants
const globalOnly = (req, res, next) => {
  if (req.user.role !== "global") {
    return res.status(403).json({
      message: "Access denied: Global privileges required",
    });
  }
  next();
};

router.post("/tenants", verifyAuth, globalOnly, createTenant);
router.get("/tenants", verifyAuth, globalOnly, listTenants);
router.get("/tenants/:id", verifyAuth, globalOnly, getTenant);
router.put("/tenants/:id", verifyAuth, globalOnly, updateTenant);
router.delete("/tenants/:id", verifyAuth, globalOnly, deleteTenant);

export default router;
