import db from "../Utils/db.js";
import crypto from "crypto";

const genId = () => crypto.randomUUID();

// Helper function to generate slug
const generateSlug = (roleName) => {
  return roleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// CREATE ROLE
export const createRole = async (req, res) => {
  const {
    roleName,
    accessLevel,
    category,
    roleDescription,
    visualAccessSettings,
    systemPermissions,
    accessRestrictions,
    notes,
    activeStatus = true,
    defaultRole = false,
  } = req.body;

  const { tenantId } = req.user; // Get from authenticated user

  if (!roleName || !roleDescription) {
    return res
      .status(400)
      .json({ message: "Role name and description are required" });
  }

  const roleSlug = generateSlug(roleName);

  // Check if role name or slug already exists for this tenant
  const [existing] = await db.query(
    `SELECT id FROM roles WHERE tenant_id = ? AND (role_name = ? OR role_slug = ?)`,
    [tenantId, roleName, roleSlug]
  );

  if (existing.length > 0) {
    return res
      .status(409)
      .json({ message: "Role name already exists for this tenant" });
  }

  const roleId = genId();

  try {
    // If setting as default, unset other defaults first
    if (defaultRole) {
      await db.query(
        `UPDATE roles SET default_role = FALSE WHERE tenant_id = ? AND default_role = TRUE`,
        [tenantId]
      );
    }

    await db.query(
      `
      INSERT INTO roles (
        id, tenant_id, role_name, role_slug, access_level, category, role_description,
        visual_access_settings, system_permissions, access_restrictions,
        notes, active_status, default_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        roleId,
        tenantId,
        roleName,
        roleSlug,
        accessLevel,
        category,
        roleDescription,
        JSON.stringify(visualAccessSettings || {}),
        JSON.stringify(systemPermissions || []),
        JSON.stringify(accessRestrictions || []),
        notes,
        activeStatus,
        defaultRole,
      ]
    );

    res.status(201).json({
      message: "Role created successfully",
      roleId,
      roleSlug,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating role",
      error: err.message,
    });
  }
};

// LIST/SEARCH ROLES
export const listRoles = async (req, res) => {
  const { tenantId } = req.user;
  const { q, filterBy, sortBy } = req.query;

  let whereClause = "tenant_id = ?";
  const params = [tenantId];

  // Search functionality
  if (q) {
    whereClause +=
      " AND (LOWER(role_name) LIKE ? OR LOWER(role_description) LIKE ? OR LOWER(category) LIKE ?)";
    const searchTerm = `%${q.toLowerCase()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Filter functionality
  if (filterBy && filterBy !== "all") {
    if (filterBy === "active") {
      whereClause += " AND active_status = TRUE";
    } else if (filterBy === "inactive") {
      whereClause += " AND active_status = FALSE";
    } else if (["low", "medium", "high", "critical"].includes(filterBy)) {
      whereClause += " AND access_level = ?";
      params.push(filterBy);
    } else {
      whereClause += " AND category = ?";
      params.push(filterBy);
    }
  }

  // Sorting
  let orderBy = "ORDER BY role_name ASC";
  if (sortBy === "access_level") {
    orderBy =
      "ORDER BY FIELD(access_level, 'critical', 'high', 'medium', 'low')";
  } else if (sortBy === "category") {
    orderBy = "ORDER BY category ASC";
  } else if (sortBy === "created_at") {
    orderBy = "ORDER BY created_at DESC";
  }

  try {
    const [roles] = await db.query(
      `
      SELECT 
        id, role_name, role_slug, access_level, category, role_description,
        visual_access_settings, system_permissions, access_restrictions,
        notes, active_status, default_role, created_at, updated_at
      FROM roles 
      WHERE ${whereClause} ${orderBy}
    `,
      params
    );

    // Parse JSON fields
    roles.forEach((role) => {
      role.visual_access_settings = JSON.parse(
        role.visual_access_settings || "{}"
      );
      role.system_permissions = JSON.parse(role.system_permissions || "[]");
      role.access_restrictions = JSON.parse(role.access_restrictions || "[]");

      // Add user count (you might want to implement this based on your user-role relationship)
      role.userCount = 0; // Placeholder - implement based on your user assignment logic
    });

    res.json({ roles });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching roles",
      error: err.message,
    });
  }
};

// GET SINGLE ROLE
export const getRole = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    const [roles] = await db.query(
      `
      SELECT * FROM roles 
      WHERE id = ? AND tenant_id = ? LIMIT 1
    `,
      [id, tenantId]
    );

    if (!roles.length) {
      return res.status(404).json({ message: "Role not found" });
    }

    const role = roles[0];
    role.visual_access_settings = JSON.parse(
      role.visual_access_settings || "{}"
    );
    role.system_permissions = JSON.parse(role.system_permissions || "[]");
    role.access_restrictions = JSON.parse(role.access_restrictions || "[]");

    res.json(role);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching role",
      error: err.message,
    });
  }
};

// UPDATE ROLE
export const updateRole = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const {
    roleName,
    accessLevel,
    category,
    roleDescription,
    visualAccessSettings,
    systemPermissions,
    accessRestrictions,
    notes,
    activeStatus,
    defaultRole,
  } = req.body;

  if (!roleName || !roleDescription) {
    return res
      .status(400)
      .json({ message: "Role name and description are required" });
  }

  const roleSlug = generateSlug(roleName);

  // Check if role name/slug already exists (excluding current role)
  const [existing] = await db.query(
    `SELECT id FROM roles WHERE tenant_id = ? AND (role_name = ? OR role_slug = ?) AND id != ?`,
    [tenantId, roleName, roleSlug, id]
  );

  if (existing.length > 0) {
    return res.status(409).json({ message: "Role name already exists" });
  }

  try {
    // If setting as default, unset other defaults first
    if (defaultRole) {
      await db.query(
        `UPDATE roles SET default_role = FALSE WHERE tenant_id = ? AND default_role = TRUE AND id != ?`,
        [tenantId, id]
      );
    }

    const [result] = await db.query(
      `
      UPDATE roles SET
        role_name = ?, role_slug = ?, access_level = ?, category = ?, role_description = ?,
        visual_access_settings = ?, system_permissions = ?, access_restrictions = ?,
        notes = ?, active_status = ?, default_role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `,
      [
        roleName,
        roleSlug,
        accessLevel,
        category,
        roleDescription,
        JSON.stringify(visualAccessSettings || {}),
        JSON.stringify(systemPermissions || []),
        JSON.stringify(accessRestrictions || []),
        notes,
        activeStatus,
        defaultRole,
        id,
        tenantId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ message: "Role updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error updating role",
      error: err.message,
    });
  }
};

// DELETE ROLE
export const deleteRole = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    // Check if role has assigned users (implement based on your user-role relationship)
    // const [userCount] = await db.query(`SELECT COUNT(*) as count FROM users WHERE role_id = ?`, [id]);
    // if (userCount[0].count > 0) {
    //   return res.status(409).json({ message: "Cannot delete role with assigned users" });
    // }

    const [result] = await db.query(
      `DELETE FROM roles WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting role",
      error: err.message,
    });
  }
};

// GET ROLE STATISTICS
export const getRoleStats = async (req, res) => {
  const { tenantId } = req.user;

  try {
    const [stats] = await db.query(
      `
      SELECT 
        COUNT(*) as total_roles,
        SUM(CASE WHEN active_status = TRUE THEN 1 ELSE 0 END) as active_roles,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT access_level) as access_levels
      FROM roles 
      WHERE tenant_id = ?
    `,
      [tenantId]
    );

    const [categoryStats] = await db.query(
      `
      SELECT category, COUNT(*) as count
      FROM roles 
      WHERE tenant_id = ?
      GROUP BY category
    `,
      [tenantId]
    );

    const [accessLevelStats] = await db.query(
      `
      SELECT access_level, COUNT(*) as count
      FROM roles 
      WHERE tenant_id = ?
      GROUP BY access_level
    `,
      [tenantId]
    );

    res.json({
      overview: stats[0],
      categoryDistribution: categoryStats,
      accessLevelDistribution: accessLevelStats,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching role statistics",
      error: err.message,
    });
  }
};
