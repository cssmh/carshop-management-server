// backend/controllers/permissionController.js
import crypto from "crypto";
import db from "../Utils/db.js";

function genId() {
  return crypto.randomUUID();
}

export const grantUserPermission = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId, modulePermissions, reason, expiresAt } = req.body;
    const grantedBy = req.user.userId;

    // Check if the granter has permission to grant permissions
    if (!["global", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only global admins and admins can grant permissions",
      });
    }

    // Validate target user exists
    const [targetUser] = await db.query(
      `SELECT id, email, role, first_name, last_name FROM users WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (!targetUser || targetUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await conn.beginTransaction();

    // Process each module permission
    for (const modulePermission of modulePermissions) {
      const { moduleName, canView, canCreate, canEdit, canDelete } =
        modulePermission;

      // Check if permission already exists
      const [existingPermission] = await conn.query(
        `SELECT id, can_view, can_create, can_edit, can_delete 
         FROM user_module_permissions 
         WHERE user_id = ? AND module_name = ?`,
        [userId, moduleName]
      );

      const oldPermissions = existingPermission[0] || null;
      const newPermissions = { canView, canCreate, canEdit, canDelete };

      if (existingPermission && existingPermission.length > 0) {
        // Update existing permission
        await conn.query(
          `UPDATE user_module_permissions 
           SET can_view = ?, can_create = ?, can_edit = ?, can_delete = ?, 
               granted_by = ?, granted_at = CURRENT_TIMESTAMP, expires_at = ?, 
               is_active = TRUE, notes = ?
           WHERE user_id = ? AND module_name = ?`,
          [
            canView,
            canCreate,
            canEdit,
            canDelete,
            grantedBy,
            expiresAt,
            reason,
            userId,
            moduleName,
          ]
        );

        // Log the modification
        await conn.query(
          `INSERT INTO permission_audit_log 
           (id, user_id, module_name, action, old_permissions, new_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'MODIFIED', ?, ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(oldPermissions),
            JSON.stringify(newPermissions),
            grantedBy,
            reason,
          ]
        );
      } else {
        // Create new permission
        await conn.query(
          `INSERT INTO user_module_permissions 
           (id, user_id, module_name, can_view, can_create, can_edit, can_delete, 
            granted_by, expires_at, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            canView,
            canCreate,
            canEdit,
            canDelete,
            grantedBy,
            expiresAt,
            reason,
          ]
        );

        // Log the grant
        await conn.query(
          `INSERT INTO permission_audit_log 
           (id, user_id, module_name, action, new_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'GRANTED', ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(newPermissions),
            grantedBy,
            reason,
          ]
        );
      }
    }

    await conn.commit();

    res.json({
      message: "Permissions granted successfully",
      user: targetUser[0],
      grantedBy: req.user.userEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    await conn.rollback();
    console.error("grantUserPermission error:", err);
    res.status(500).json({ message: "Error granting permissions" });
  } finally {
    conn.release();
  }
};

export const revokeUserPermission = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { userId, moduleNames, reason } = req.body;
    const revokedBy = req.user.userId;

    if (!["global", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only global admins and admins can revoke permissions",
      });
    }

    await conn.beginTransaction();

    for (const moduleName of moduleNames) {
      // Get current permission for audit log
      const [currentPermission] = await conn.query(
        `SELECT can_view, can_create, can_edit, can_delete 
         FROM user_module_permissions 
         WHERE user_id = ? AND module_name = ?`,
        [userId, moduleName]
      );

      // Revoke permission
      await conn.query(
        `UPDATE user_module_permissions 
         SET is_active = FALSE 
         WHERE user_id = ? AND module_name = ?`,
        [userId, moduleName]
      );

      // Log the revocation
      if (currentPermission && currentPermission.length > 0) {
        await conn.query(
          `INSERT INTO permission_audit_log 
           (id, user_id, module_name, action, old_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'REVOKED', ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(currentPermission[0]),
            revokedBy,
            reason,
          ]
        );
      }
    }

    await conn.commit();
    res.json({ message: "Permissions revoked successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("revokeUserPermission error:", err);
    res.status(500).json({ message: "Error revoking permissions" });
  } finally {
    conn.release();
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's role-based permissions
    const [user] = await db.query(
      `SELECT role, first_name, last_name, email FROM users WHERE id = ?`,
      [userId]
    );

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user-specific permissions
    const [userSpecificPermissions] = await db.query(
      `SELECT ump.module_name, ump.can_view, ump.can_create, ump.can_edit, ump.can_delete,
              ump.granted_at, ump.expires_at, ump.notes,
              granter.first_name as granter_first_name, granter.last_name as granter_last_name
       FROM user_module_permissions ump
       LEFT JOIN users granter ON ump.granted_by = granter.id
       WHERE ump.user_id = ? AND ump.is_active = TRUE 
       AND (ump.expires_at IS NULL OR ump.expires_at > NOW())
       ORDER BY ump.module_name`,
      [userId]
    );

    // Get role-based permissions (from your existing MODULE_PERMISSIONS)
    const rolePermissions = getModulesForRole(user[0].role);

    res.json({
      user: user[0],
      roleBasedPermissions: rolePermissions,
      userSpecificPermissions: userSpecificPermissions,
      effectivePermissions: mergePermissions(
        rolePermissions,
        userSpecificPermissions
      ),
    });
  } catch (err) {
    console.error("getUserPermissions error:", err);
    res.status(500).json({ message: "Error fetching user permissions" });
  }
};

// Helper function to merge role-based and user-specific permissions
function mergePermissions(rolePermissions, userSpecificPermissions) {
  const merged = new Set(rolePermissions);

  userSpecificPermissions.forEach((perm) => {
    if (perm.can_view) {
      merged.add(perm.module_name);
    }
  });

  return Array.from(merged);
}

export const getAllUsersWithPermissions = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              COUNT(ump.id) as custom_permissions_count
       FROM users u
       LEFT JOIN user_module_permissions ump ON u.id = ump.user_id AND ump.is_active = TRUE
       WHERE u.is_active = 1
       GROUP BY u.id
       ORDER BY u.first_name, u.last_name`
    );

    res.json({ users });
  } catch (err) {
    console.error("getAllUsersWithPermissions error:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};
