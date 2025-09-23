import crypto from "crypto";
import db from "../Utils/db.js";

// CREATE
export const createVehicleLocation = async (req, res) => {
  const { type, property, value, isActive } = req.body;
  if (!type || !property || value === undefined)
    return res.status(400).json({ message: "Missing fields" });

  const id = crypto.randomUUID();
  try {
    await db.query(
      `INSERT INTO vehicle_location (id, type, property, value, is_active) VALUES (?, ?, ?, ?, ?)`,
      [id, type, property, value, isActive !== false]
    );
    res.status(201).json({ message: "Vehicle location created", id });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// READ (all/search)
export const listVehicleLocations = async (req, res) => {
  const { q } = req.query;
  let sql = `SELECT id, type, property, value, is_active FROM vehicle_location`;
  let params = [];
  if (q) {
    sql += ` WHERE LOWER(type) LIKE ? OR LOWER(property) LIKE ? OR value LIKE ?`;
    params = [`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q}%`];
  }
  sql += " ORDER BY created_at DESC";
  try {
    const [rows] = await db.query(sql, params);
    res.json({ locations: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET one
export const getVehicleLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT id, type, property, value, is_active FROM vehicle_location WHERE id = ?`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Vehicle location not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE
export const updateVehicleLocation = async (req, res) => {
  const { id } = req.params;
  const { type, property, value, isActive } = req.body;
  if (!type || !property || value === undefined)
    return res.status(400).json({ message: "Missing fields" });
  try {
    const [result] = await db.query(
      `UPDATE vehicle_location SET type=?, property=?, value=?, is_active=? WHERE id=?`,
      [type, property, value, isActive !== false, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Vehicle location not found" });
    res.json({ message: "Vehicle location updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE (hard delete)
export const deleteVehicleLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `DELETE FROM vehicle_location WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Vehicle location not found" });
    res.json({ message: "Vehicle location deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
