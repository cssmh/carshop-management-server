import db from "../Utils/db.js";
import crypto from "crypto";

const genId = () => crypto.randomUUID();

// CREATE TENANT
export const createTenant = async (req, res) => {
  const { name, domain, status = "active" } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Tenant name is required" });
  }

  // Check if domain already exists
  if (domain) {
    const [existing] = await db.query(
      `SELECT id FROM tenants WHERE domain = ? AND id != ?`,
      [domain, ""]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Domain already exists" });
    }
  }

  const tenantId = genId();

  try {
    await db.query(
      `INSERT INTO tenants (id, name, domain, status) VALUES (?, ?, ?, ?)`,
      [tenantId, name, domain || null, status]
    );

    res.status(201).json({
      message: "Tenant created successfully",
      tenant: { id: tenantId, name, domain, status },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating tenant",
      error: err.message,
    });
  }
};

// LIST/SEARCH TENANTS
export const listTenants = async (req, res) => {
  const { q, status } = req.query;

  let whereClause = "1=1";
  const params = [];

  // Search functionality
  if (q) {
    whereClause += " AND (LOWER(name) LIKE ? OR LOWER(domain) LIKE ?)";
    const searchTerm = `%${q.toLowerCase()}%`;
    params.push(searchTerm, searchTerm);
  }

  // Filter by status
  if (status && status !== "all") {
    whereClause += " AND status = ?";
    params.push(status);
  }

  try {
    const [tenants] = await db.query(
      `SELECT * FROM tenants WHERE ${whereClause} ORDER BY created_at DESC`,
      params
    );

    res.json({ tenants });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching tenants",
      error: err.message,
    });
  }
};

// GET SINGLE TENANT
export const getTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const [tenants] = await db.query(
      `SELECT * FROM tenants WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!tenants.length) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenants[0]);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching tenant",
      error: err.message,
    });
  }
};

// UPDATE TENANT
export const updateTenant = async (req, res) => {
  const { id } = req.params;
  const { name, domain, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Tenant name is required" });
  }

  // Check if domain already exists (excluding current tenant)
  if (domain) {
    const [existing] = await db.query(
      `SELECT id FROM tenants WHERE domain = ? AND id != ?`,
      [domain, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Domain already exists" });
    }
  }

  try {
    const [result] = await db.query(
      `UPDATE tenants SET name = ?, domain = ?, status = ? WHERE id = ?`,
      [name, domain || null, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({ message: "Tenant updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error updating tenant",
      error: err.message,
    });
  }
};

// DELETE TENANT
export const deleteTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(`DELETE FROM tenants WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({ message: "Tenant deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting tenant",
      error: err.message,
    });
  }
};
