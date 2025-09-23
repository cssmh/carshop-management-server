import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  createShop,
  listShops,
  getShop,
  updateShop,
  deleteShop,
} from "../Controllers/shopController.js";

const router = express.Router();

router.post("/shops", verifyAuth, createShop); // Create
router.get("/shops", verifyAuth, listShops); // List/search
router.get("/shops/:id", verifyAuth, getShop); // View one
router.put("/shops/:id", verifyAuth, updateShop); // Update
router.delete("/shops/:id", verifyAuth, deleteShop); // Soft delete

export default router;
