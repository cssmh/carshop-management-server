import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  createShop,
  listShops,
  getShop,
  updateShop,
  deleteShop,
  getActiveTenants,
  getShopStats, // Add this new endpoint
} from "../Controllers/globalShopController.js";

const router = express.Router();

// Global users only middleware
const globalOnly = (req, res, next) => {
  if (req.user.role !== "global") {
    return res.status(403).json({
      message: "Access denied: Global privileges required",
    });
  }
  next();
};

// Shop management routes
router.get("/shops/tenants", verifyAuth, globalOnly, getActiveTenants);
router.get("/shops/stats", verifyAuth, globalOnly, getShopStats);
router.post("/shops", verifyAuth, globalOnly, createShop);
router.get("/shops", verifyAuth, globalOnly, listShops);
router.get("/shops/:id", verifyAuth, globalOnly, getShop);
router.put("/shops/:id", verifyAuth, globalOnly, updateShop);
router.delete("/shops/:id", verifyAuth, globalOnly, deleteShop);

export default router;
