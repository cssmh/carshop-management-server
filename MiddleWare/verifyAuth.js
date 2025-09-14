import jwt from "jsonwebtoken";

export const verifyAuth = (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};
