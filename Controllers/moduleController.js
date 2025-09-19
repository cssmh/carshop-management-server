// backend/controllers/moduleController.js
import db from "../Utils/db.js";
import { getModulesForRole } from "../Utils/moduleConfig.js";

export const getUserModules = async (req, res) => {
  try {
    const { role } = req.user;

    // Get modules from database for dynamic permissions
    const [modulePermissions] = await db.query(
      `SELECT module_name, can_view, can_create, can_edit, can_delete 
       FROM module_permissions 
       WHERE role = ? AND can_view = TRUE
       ORDER BY module_name`,
      [role]
    );

    const modules = modulePermissions.map((perm) => ({
      module: perm.module_name,
      permissions: {
        view: perm.can_view,
        create: perm.can_create,
        edit: perm.can_edit,
        delete: perm.can_delete,
      },
    }));

    res.json({
      modules: modules,
      role: role,
    });
  } catch (err) {
    console.error("getUserModules error:", err);
    res.status(500).json({ message: "Error fetching user modules" });
  }
};

export const checkUserPermission = async (req, res) => {
  try {
    const { role } = req.user;
    const { module, action } = req.params; // action: view, create, edit, delete

    const [permission] = await db.query(
      `SELECT can_${action} FROM module_permissions 
       WHERE role = ? AND module_name = ? LIMIT 1`,
      [role, module]
    );

    if (!permission || !permission[0] || !permission[0][`can_${action}`]) {
      return res.status(403).json({
        message: `You don't have permission to ${action} ${module}`,
      });
    }

    res.json({ hasPermission: true });
  } catch (err) {
    console.error("checkUserPermission error:", err);
    res.status(500).json({ message: "Error checking permissions" });
  }
};

// backend/controllers/moduleController.js (updated)
export const getUserSpecificPermissionsModules = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Get role-based permissions
    const roleBasedModules = getModulesForRole(role);

    // Get user-specific permissions
    const [userSpecificPermissions] = await db.query(
      `SELECT module_name, can_view, can_create, can_edit, can_delete 
       FROM user_module_permissions 
       WHERE user_id = ? AND is_active = TRUE 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    // Merge permissions
    const allModules = new Set(roleBasedModules);
    const modulePermissions = {};

    // Add role-based modules with default permissions
    roleBasedModules.forEach((module) => {
      modulePermissions[module] = {
        view: true,
        create: false,
        edit: false,
        delete: false,
        source: "role",
      };
    });

    // Add/override with user-specific permissions
    userSpecificPermissions.forEach((perm) => {
      if (perm.can_view) {
        allModules.add(perm.module_name);
        modulePermissions[perm.module_name] = {
          view: perm.can_view,
          create: perm.can_create,
          edit: perm.can_edit,
          delete: perm.can_delete,
          source: "custom",
        };
      }
    });

    res.json({
      modules: Array.from(allModules),
      permissions: modulePermissions,
      role: role,
    });
  } catch (err) {
    console.error("getUserModules error:", err);
    res.status(500).json({ message: "Error fetching user modules" });
  }
};
