import jwt from "jsonwebtoken";

export const verifyModerator = (req, res, next) => {
  const token = req.cookies?.admin_token;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.role !== "moderator") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};
