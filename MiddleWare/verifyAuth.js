import jwt from "jsonwebtoken";
import db from "../Utils/db.js";

export const verifyAuth = async (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    // First decode the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Check if this token exists in DB
    const [users] = await db.query(
      `SELECT id, tenant_id, role, token 
       FROM users 
       WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [decoded.userId, decoded.tenantId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = users[0];

    // If DB token is NULL or doesn’t match, force logout
    if (!user.token || user.token !== token) {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      });
      return res.status(401).json({ message: "Session expired, please login" });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("verifyAuth error:", err.message);
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
