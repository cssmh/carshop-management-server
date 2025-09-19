import jwt from "jsonwebtoken";
import db from "../Utils/db.js";

export const verifyAuth = async (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    // First decode the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Extract all data from token
    const { userId, userEmail, tenantId, shopId, role } = decoded;

    // Validate required fields
    if (!userId || !userEmail || !role) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Check if user exists and is active
    const [users] = await db.query(
      `SELECT id, email, role, token, first_name, last_name, is_active 
       FROM users 
       WHERE id = ? AND email = ? AND is_active = 1 
       LIMIT 1`,
      [userId, userEmail]
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

    // Validate tenant access if tenantId is provided
    if (tenantId) {
      const [userTenants] = await db.query(
        `SELECT ut.user_id 
         FROM user_tenants ut 
         JOIN tenants t ON ut.tenant_id = t.id 
         WHERE ut.user_id = ? AND ut.tenant_id = ? AND t.status = 'active' 
         LIMIT 1`,
        [userId, tenantId]
      );

      if (!userTenants || userTenants.length === 0) {
        return res.status(403).json({
          message: "Access denied to selected tenant",
        });
      }
    }

    // Validate shop access if shopId is provided
    if (shopId) {
      const [userShops] = await db.query(
        `SELECT us.user_id 
         FROM user_shops us 
         JOIN shops s ON us.shop_id = s.id 
         WHERE us.user_id = ? AND us.shop_id = ? AND s.status = 'active' 
         LIMIT 1`,
        [userId, shopId]
      );

      if (!userShops || userShops.length === 0) {
        return res.status(403).json({
          message: "Access denied to selected shop",
        });
      }
    }

    // Attach comprehensive user info to request
    req.user = {
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: tenantId || null,
      shopId: shopId || null,
    };

    next();
  } catch (err) {
    console.error("verifyAuth error:", err.message);
    // Clear cookie on any error
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    } else if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token, please login again" });
    } else {
      return res.status(401).json({ message: "Authentication failed" });
    }
  }
};
