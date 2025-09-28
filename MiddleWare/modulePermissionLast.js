import db from "../Utils/db.js";

// Check permission for a module and action (view/create/edit/delete)
export const checkModulePermission =
  (module, action = "can_view") =>
  async (req, res, next) => {
    const userId = req.user.userId;
    // ১. ইউজার-ওভাররাইড চেক
    const [userPerm] = await db.query(
      `SELECT ${action} FROM user_module_permissions 
     WHERE user_id=? AND module_name=? AND is_active=1 AND (expires_at IS NULL OR expires_at>NOW()) LIMIT 1`,
      [userId, module]
    );
    if (userPerm[0] && userPerm[0][action]) return next();
    // fallback: role-based
    const [rolePerm] = await db.query(
      `SELECT ${action} FROM module_permissions WHERE role=? AND module_name=? LIMIT 1`,
      [req.user.role, module]
    );
    if (rolePerm[0] && rolePerm[0][action]) return next();

    return res.status(403).json({ message: "Permission denied" });
  };
