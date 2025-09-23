import crypto from "crypto";
import db from "../Utils/db.js";

// Helper: Only admin/global users can edit shops
async function isAdminOrGlobal(userId, tenantId) {
  const [rows] = await db.query(
    `SELECT u.role FROM users u
     JOIN user_tenants ut ON u.id = ut.user_id
     WHERE u.id = ? AND ut.tenant_id = ? AND u.is_active = 1 LIMIT 1`,
    [userId, tenantId]
  );
  if (!rows || rows.length === 0) return false;
  return ["admin", "global"].includes(rows[0].role);
}

// CREATE shop
export const createShop = async (req, res) => {
  const { name, address, phone, type, status } = req.body;
  const userId = req.user.userId;
  const tenantId = req.user.tenantId;

  console.log({ name, address, phone, type, status });

  if (!(await isAdminOrGlobal(userId, tenantId)))
    return res.status(403).json({ message: "Access denied" });

  if (!name || !address || !address.city || !address.street || !type)
    return res.status(400).json({ message: "Missing fields" });

  const shopId = crypto.randomUUID();
  try {
    await db.query(
      `INSERT INTO shop_location (id, tenant_id, name, address, phone, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        tenantId,
        name,
        JSON.stringify(address),
        phone,
        type,
        status || "active",
      ]
    );
    res.status(201).json({ message: "Shop created", shopId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET all shops (with optional search)
export const listShops = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { q } = req.query; // search string
  let sql = `SELECT id, name, address, phone, type, status FROM shop_location WHERE tenant_id = ?`;
  let params = [tenantId];
  if (q) {
    sql += ` AND (
      LOWER(name) LIKE ?
      OR LOWER(JSON_UNQUOTE(address->'$.city')) LIKE ?
      OR LOWER(JSON_UNQUOTE(address->'$.street')) LIKE ?
      OR LOWER(phone) LIKE ?
      OR LOWER(type) LIKE ?
      OR LOWER(status) LIKE ?
    )`;
    params.push(
      `%${q.toLowerCase()}%`,
      `%${q.toLowerCase()}%`,
      `%${q.toLowerCase()}%`,
      `%${q.toLowerCase()}%`,
      `%${q.toLowerCase()}%`,
      `%${q.toLowerCase()}%`
    );
  }
  sql += ` ORDER BY created_at DESC`;
  try {
    const [shops] = await db.query(sql, params);
    shops.forEach((s) => {
      s.address = JSON.parse(s.address);
    });
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET single shop by id
export const getShop = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  try {
    const [shops] = await db.query(
      `SELECT id, name, address, phone, type, status FROM shop_location WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [id, tenantId]
    );
    if (!shops.length)
      return res.status(404).json({ message: "Shop not found" });
    shops[0].address = JSON.parse(shops[0].address);
    res.json(shops[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE shop
export const updateShop = async (req, res) => {
  const { name, address, phone, type, status } = req.body;
  const { id } = req.params;
  const userId = req.user.userId;
  const tenantId = req.user.tenantId;

  if (!(await isAdminOrGlobal(userId, tenantId)))
    return res.status(403).json({ message: "Access denied" });

  if (!name || !address || !address.city || !address.street || !type)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const [result] = await db.query(
      `UPDATE shop_location SET name=?, address=?, phone=?, type=?, status=? WHERE id=? AND tenant_id=?`,
      [name, JSON.stringify(address), phone, type, status, id, tenantId]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Shop not found or not in your tenant" });
    }
    res.json({ message: "Shop updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE shop (soft delete)
export const deleteShop = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const userId = req.user.userId;
  const tenantId = req.user.tenantId;

  if (!(await isAdminOrGlobal(userId, tenantId)))
    return res.status(403).json({ message: "Access denied" });

  try {
    const [result] = await db.query(
      "UPDATE shop_location SET status = 'inactive' WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );

    if (result.affectedRows === 0) {
      // No row matched
      return res.status(404).json({ message: "Shop not found" });
    } else if (result.changedRows === 0) {
      // Row matched, but nothing changed
      return res.status(200).json({ message: "Shop was already inactive." });
    } else {
      // Row matched and changed
      return res
        .status(200)
        .json({ message: "Shop deleted (status set to inactive)" });
    }
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
};
