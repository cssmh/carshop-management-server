import db from "../Utils/db.js";
import crypto from "crypto";

// Helper
const genId = () => crypto.randomUUID();

// 1. Grant/Update user-specific module permission
export const grantUserPermission = async (req, res) => {
  const { userId, modulePermissions, reason, expiresAt } = req.body;
  const grantedBy = req.user.userId;

  if (!["global", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only global/admin can grant." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const modulePermission of modulePermissions) {
      const { moduleName, canView, canCreate, canEdit, canDelete } =
        modulePermission;
      // Check if already exists
      const [existing] = await conn.query(
        `SELECT * FROM user_module_permissions WHERE user_id=? AND module_name=?`,
        [userId, moduleName]
      );
      const oldPerms = existing[0] || null;
      const newPerms = { canView, canCreate, canEdit, canDelete };

      if (existing.length) {
        await conn.query(
          `UPDATE user_module_permissions SET can_view=?, can_create=?, can_edit=?, can_delete=?, granted_by=?, granted_at=NOW(), expires_at=?, is_active=TRUE, notes=? WHERE user_id=? AND module_name=?`,
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
        // Audit
        await conn.query(
          `INSERT INTO permission_audit_log (id, user_id, module_name, action, old_permissions, new_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'MODIFIED', ?, ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(oldPerms),
            JSON.stringify(newPerms),
            grantedBy,
            reason,
          ]
        );
      } else {
        await conn.query(
          `INSERT INTO user_module_permissions (id, user_id, module_name, can_view, can_create, can_edit, can_delete, granted_by, expires_at, notes)
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
        await conn.query(
          `INSERT INTO permission_audit_log (id, user_id, module_name, action, new_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'GRANTED', ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(newPerms),
            grantedBy,
            reason,
          ]
        );
      }
    }
    await conn.commit();
    res.json({ message: "Permissions granted/updated!" });
  } catch (e) {
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Error granting permission", error: e.message });
  } finally {
    conn.release();
  }
};

// 2. Revoke user-specific module permission
export const revokeUserPermission = async (req, res) => {
  const { userId, moduleNames, reason } = req.body;
  const revokedBy = req.user.userId;

  if (!["global", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only global/admin can revoke." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const moduleName of moduleNames) {
      // For audit
      const [currPerm] = await conn.query(
        `SELECT can_view, can_create, can_edit, can_delete FROM user_module_permissions WHERE user_id=? AND module_name=? AND is_active=TRUE`,
        [userId, moduleName]
      );
      await conn.query(
        `UPDATE user_module_permissions SET is_active=FALSE WHERE user_id=? AND module_name=?`,
        [userId, moduleName]
      );
      if (currPerm.length) {
        await conn.query(
          `INSERT INTO permission_audit_log (id, user_id, module_name, action, old_permissions, granted_by, reason)
           VALUES (?, ?, ?, 'REVOKED', ?, ?, ?)`,
          [
            genId(),
            userId,
            moduleName,
            JSON.stringify(currPerm[0]),
            revokedBy,
            reason,
          ]
        );
      }
    }

    await conn.commit();
    res.json({ message: "Permissions revoked!" });
  } catch (err) {
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Error revoking permission", error: err.message });
  } finally {
    conn.release();
  }
};

// 3. Get effective permissions for a user for all modules
export const getUserEffectivePermissions = async (req, res) => {
  const { userId } = req.params;

  // Get user's role
  const [userRows] = await db.query(`SELECT role FROM users WHERE id=?`, [
    userId,
  ]);
  if (!userRows.length)
    return res.status(404).json({ message: "User not found" });
  const role = userRows[0].role;

  // Get role-based perms
  const [rolePerms] = await db.query(
    `SELECT module_name, can_view, can_create, can_edit, can_delete FROM module_permissions WHERE role=?`,
    [role]
  );
  const rolePermMap = {};
  rolePerms.forEach((rp) => {
    rolePermMap[rp.module_name] = {
      can_view: !!rp.can_view,
      can_create: !!rp.can_create,
      can_edit: !!rp.can_edit,
      can_delete: !!rp.can_delete,
      source: "role",
    };
  });

  // Get user-specific perms (only active)
  const [userPerms] = await db.query(
    `SELECT module_name, can_view, can_create, can_edit, can_delete FROM user_module_permissions 
     WHERE user_id=? AND is_active=TRUE AND (expires_at IS NULL OR expires_at>NOW())`,
    [userId]
  );
  userPerms.forEach((up) => {
    rolePermMap[up.module_name] = {
      can_view: !!up.can_view,
      can_create: !!up.can_create,
      can_edit: !!up.can_edit,
      can_delete: !!up.can_delete,
      source: "custom",
    };
  });

  res.json({ userId, effectivePermissions: rolePermMap });
};
