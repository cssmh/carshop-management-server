import db from "../Utils/db.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const genId = () => crypto.randomUUID();

// CREATE USER with enhanced features
export const createUser = async (req, res) => {
  const {
    // Basic Info
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    department,
    employeeId,
    phone,
    role,
    status = "active",

    // Personal Info
    dateOfBirth,
    hireDate,
    annualSalary = 0,

    // Address Info
    addressInfo,
    emergencyContact,
    workSchedule,

    // Skills & Qualifications
    skillsExpertise = [],
    certificates = [],
    languages = [],

    // System
    systemPermissions = [],
    notes = "",

    // Global user specific fields
    selectedTenants = [],
    selectedShops = [],
    canAccessAllShops = false,
  } = req.body;

  const creatorId = req.user.userId;
  const creatorRole = req.user.role;
  const { tenantId: creatorTenantId } = req.user;

  // Validation
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Role validation based on creator
  const canCreate = {
    global: ["admin", "manager", "staff", "technician", "cashier"],
    admin: ["manager", "staff", "technician", "cashier"],
    manager: ["staff", "technician", "cashier"],
  };

  if (!canCreate[creatorRole]?.includes(role)) {
    return res.status(403).json({
      message: `${creatorRole} cannot create ${role} users`,
    });
  }

  // Check email uniqueness
  const [existing] = await db.query(`SELECT id FROM users WHERE email = ?`, [
    email,
  ]);
  if (existing.length) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const userId = genId();
  const hashedPassword = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Create user
    await conn.query(
      `
      INSERT INTO users (
        id, role, first_name, last_name, email, password_hash, department, 
        employee_id, phone, status, date_of_birth, hire_date, annual_salary,
        address_info, emergency_contact, work_schedule, skills_expertise,
        certificates, languages, system_permissions, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        role,
        firstName,
        lastName,
        email,
        hashedPassword,
        department,
        employeeId,
        phone,
        status,
        dateOfBirth,
        hireDate,
        annualSalary,
        JSON.stringify(addressInfo || {}),
        JSON.stringify(emergencyContact || {}),
        JSON.stringify(workSchedule || {}),
        JSON.stringify(skillsExpertise),
        JSON.stringify(certificates),
        JSON.stringify(languages),
        JSON.stringify(systemPermissions),
        notes,
        true,
      ]
    );

    // Handle tenant assignments
    if (creatorRole === "global" && selectedTenants.length > 0) {
      // Global user can assign to multiple tenants
      for (const tenantId of selectedTenants) {
        await conn.query(
          `
          INSERT INTO user_tenants (id, user_id, tenant_id, assigned_role, can_access_all_shops, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [genId(), userId, tenantId, role, canAccessAllShops, creatorId]
        );
      }
    } else {
      // Non-global users assign to their own tenant
      await conn.query(
        `
        INSERT INTO user_tenants (id, user_id, tenant_id, assigned_role, created_by)
        VALUES (?, ?, ?, ?, ?)
      `,
        [genId(), userId, creatorTenantId, role, creatorId]
      );
    }

    // Handle shop assignments
    if (selectedShops.length > 0) {
      for (const shopAssignment of selectedShops) {
        const { shopId, tenantId, accessLevel = "limited" } = shopAssignment;
        await conn.query(
          `
          INSERT INTO user_shops (id, user_id, shop_id, tenant_id, assigned_role, access_level, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [genId(), userId, shopId, tenantId, role, accessLevel, creatorId]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        name: `${firstName} ${lastName}`,
        email,
        role,
        department,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error("User creation error:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  } finally {
    conn.release();
  }
};

// GET TENANTS AND SHOPS for global users
export const getTenantsAndShops = async (req, res) => {
  const { role } = req.user;

  if (role !== "global") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    // Get active tenants
    const [tenants] = await db.query(`
      SELECT id, name, domain, status FROM tenants 
      WHERE status = 'active' ORDER BY name ASC
    `);

    // Get active shops with tenant info
    const [shops] = await db.query(`
      SELECT s.id, s.name, s.tenant_id, s.status, t.name as tenant_name
      FROM shops s
      JOIN tenants t ON s.tenant_id = t.id
      WHERE s.status = 'active' AND t.status = 'active'
      ORDER BY t.name ASC, s.name ASC
    `);

    res.json({ tenants, shops });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

// LIST USERS with enhanced filtering
export const listUsers = async (req, res) => {
  const { role, userId, tenantId } = req.user;
  const { search, filterBy, sortBy = "first_name" } = req.query;

  let whereClause = "1=1";
  const params = [];

  // Apply role-based filtering
  if (role === "global") {
    // Global sees all users
  } else if (role === "admin") {
    // Admin sees users in their tenant
    whereClause +=
      " AND u.id IN (SELECT ut.user_id FROM user_tenants ut WHERE ut.tenant_id = ?)";
    params.push(tenantId);
  } else {
    // Others see limited users
    whereClause +=
      " AND u.id IN (SELECT us.user_id FROM user_shops us WHERE us.tenant_id = ?)";
    params.push(tenantId);
  }

  // Search functionality
  if (search) {
    whereClause += ` AND (LOWER(u.first_name) LIKE ? OR LOWER(u.last_name) LIKE ? 
                    OR LOWER(u.email) LIKE ? OR LOWER(u.employee_id) LIKE ?)`;
    const searchTerm = `%${search.toLowerCase()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Filter functionality
  if (filterBy && filterBy !== "all") {
    if (filterBy === "active") {
      whereClause += " AND u.is_active = TRUE";
    } else if (filterBy === "inactive") {
      whereClause += " AND u.is_active = FALSE";
    } else {
      whereClause += " AND (u.role = ? OR u.status = ?)";
      params.push(filterBy, filterBy);
    }
  }

  // Sorting
  const validSortFields = [
    "first_name",
    "last_name",
    "role",
    "department",
    "created_at",
  ];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : "first_name";

  try {
    const [users] = await db.query(
      `
      SELECT u.*, 
        GROUP_CONCAT(DISTINCT t.name) as tenant_names,
        GROUP_CONCAT(DISTINCT s.name) as shop_names
      FROM users u
      LEFT JOIN user_tenants ut ON u.id = ut.user_id
      LEFT JOIN tenants t ON ut.tenant_id = t.id
      LEFT JOIN user_shops us ON u.id = us.user_id
      LEFT JOIN shops s ON us.shop_id = s.id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY u.${orderBy} ASC
    `,
      params
    );

    // Parse JSON fields
    users.forEach((user) => {
      user.address_info = JSON.parse(user.address_info || "{}");
      user.emergency_contact = JSON.parse(user.emergency_contact || "{}");
      user.work_schedule = JSON.parse(user.work_schedule || "{}");
      user.skills_expertise = JSON.parse(user.skills_expertise || "[]");
      user.certificates = JSON.parse(user.certificates || "[]");
      user.languages = JSON.parse(user.languages || "[]");
      user.system_permissions = JSON.parse(user.system_permissions || "[]");
    });

    res.json({ users });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { role: updaterRole, userId: updaterId } = req.user;

  // Permission check
  if (updaterRole !== "global" && updaterRole !== "admin" && updaterId !== id) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const updateFields = [];
    const updateParams = [];

    // Handle basic fields
    const basicFields = [
      "first_name",
      "last_name",
      "department",
      "employee_id",
      "phone",
      "status",
      "date_of_birth",
      "hire_date",
      "annual_salary",
      "notes",
    ];

    basicFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(updates[field]);
      }
    });

    // Handle JSON fields
    const jsonFields = [
      "address_info",
      "emergency_contact",
      "work_schedule",
      "skills_expertise",
      "certificates",
      "languages",
      "system_permissions",
    ];

    jsonFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(JSON.stringify(updates[field]));
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    updateParams.push(id);

    const [result] = await db.query(
      `
      UPDATE users SET ${updateFields.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      updateParams
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "global" && role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deactivated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};
