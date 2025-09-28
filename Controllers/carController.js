import db from "../Utils/db.js";
import crypto from "crypto";

// Helper: Only cars belonging to the same tenant/shop are allowed
function carWhere(req, extra = "") {
  return `tenant_id = ? AND shop_id = ? AND is_deleted = 0 ${
    extra ? "AND " + extra : ""
  }`;
}

// CREATE car
export const createCar = async (req, res) => {
  const { color, make, model, style, engine, year, is_active, notes } =
    req.body;
  const { tenantId, shopId, userId } = req.user;

  if (!color || !make || !model || !style || !engine) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const id = crypto.randomUUID();
  try {
    await db.query(
      `INSERT INTO cars 
        (id, tenant_id, shop_id, created_by, color, make, model, style, engine, year, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        shopId,
        userId,
        color,
        make,
        model,
        style,
        engine,
        year || null,
        is_active !== false,
        notes || null,
      ]
    );
    res.status(201).json({ message: "Car added", carId: id });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
};

// LIST/SEARCH/FILTER
export const listCars = async (req, res) => {
  const { tenantId, shopId } = req.user;
  const { q, filterBy, sortBy } = req.query;

  let sql = `SELECT * FROM cars WHERE ${carWhere(req)}`;
  let params = [tenantId, shopId];

  if (q) {
    sql += ` AND (
      LOWER(make) LIKE ?
      OR LOWER(model) LIKE ?
      OR LOWER(color) LIKE ?
      OR LOWER(style) LIKE ?
      OR LOWER(engine) LIKE ?
      OR IFNULL(year, '') LIKE ?
    )`;
    const qLike = `%${q.toLowerCase()}%`;
    params.push(qLike, qLike, qLike, qLike, qLike, qLike);
  }
  if (filterBy) {
    if (filterBy === "active") sql += " AND is_active = 1";
    else if (filterBy === "inactive") sql += " AND is_active = 0";
    else if (
      ["petrol", "diesel", "hybrid", "electric"].includes(
        filterBy.toLowerCase()
      )
    )
      sql += " AND LOWER(engine) = ?";
    else if (
      ["sedan", "suv", "truck", "hatchback"].includes(filterBy.toLowerCase())
    )
      sql += " AND LOWER(style) = ?";
    if (
      [
        "petrol",
        "diesel",
        "hybrid",
        "electric",
        "sedan",
        "suv",
        "truck",
        "hatchback",
      ].includes(filterBy.toLowerCase())
    )
      params.push(filterBy.toLowerCase());
  }
  // Sorting
  let order = "ORDER BY created_at DESC";
  if (sortBy) {
    if (["make", "model", "year", "style", "engine"].includes(sortBy))
      order = `ORDER BY ${sortBy} ASC`;
  }
  sql += " " + order;

  try {
    const [cars] = await db.query(sql, params);
    res.json({ cars });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
};

// VIEW
export const getCar = async (req, res) => {
  const { tenantId, shopId } = req.user;
  const { id } = req.params;
  try {
    const [cars] = await db.query(
      `SELECT * FROM cars WHERE id = ? AND ${carWhere(req)}`,
      [id, tenantId, shopId]
    );
    if (!cars.length) return res.status(404).json({ message: "Car not found" });
    res.json(cars[0]);
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
};

// UPDATE
export const updateCar = async (req, res) => {
  const { id } = req.params;
  const { tenantId, shopId } = req.user;
  // Only allow updating fields in the demo
  const fields = [
    "color",
    "make",
    "model",
    "style",
    "engine",
    "year",
    "is_active",
    "notes",
  ];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  if (!updates.length)
    return res.status(400).json({ message: "No fields to update" });

  try {
    const [result] = await db.query(
      `UPDATE cars SET ${updates.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND ${carWhere(req)}`,
      [...params, id, tenantId, shopId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Car updated" });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
};

// SOFT DELETE
export const deleteCar = async (req, res) => {
  const { id } = req.params;
  const { tenantId, shopId } = req.user;
  try {
    const [result] = await db.query(
      `UPDATE cars SET is_deleted = 1, is_active = 0 WHERE id = ? AND ${carWhere(
        req
      )}`,
      [id, tenantId, shopId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Car deleted" });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
};
