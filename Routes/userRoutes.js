import express from "express";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";
import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  getTenantsAndShops,
} from "../Controllers/UserController.js";

const router = express.Router();

router.post("/users", verifyAuth, createUser);
router.get("/users", verifyAuth, listUsers);
router.get("/users/tenants-shops", verifyAuth, getTenantsAndShops);
router.put("/users/:id", verifyAuth, updateUser);
router.delete("/users/:id", verifyAuth, deleteUser);

export default router;
