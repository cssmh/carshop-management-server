import express from "express";
import { login, me, registerTenant } from "../Controllers/authController.js";
import { verifyAuth } from "../MiddleWare/verifyAuth.js";

const router = express.Router();

router.post("/register-tenant", registerTenant);
router.post("/login", login);
router.get("/verify", verifyAuth, (req, res) => {
  res.status(200).json({ message: `Welcome  ${req.user.role}` });
});
router.get("/me", verifyAuth, me);

export default router;
