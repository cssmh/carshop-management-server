import express from "express";
import {
  login,
  logout,
  me,
  registerTenant,
} from "../Controllers/authController.js";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";

const router = express.Router();

router.post("/register-tenant", registerTenant);
router.post("/login", login);
router.get("/me", verifyAuth, me);
router.post("/logout", logout);

export default router;
