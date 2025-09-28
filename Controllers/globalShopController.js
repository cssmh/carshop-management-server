import db from "../Utils/db.js";
import crypto from "crypto";

const genId = () => crypto.randomUUID();

// CREATE SHOP (Fixed with proper tenant name response)
// export const createShop = async (req, res) => {
//   const { tenantId, name, address, phone, status = "active" } = req.body;
//   const { role } = req.user;

//   // Only global users can create shops
//   if (role !== "global") {
//     return res.status(403).json({
//       message: "Only global users can create shops",
//     });
//   }

//   if (!tenantId || !name || !address) {
//     return res.status(400).json({
//       message: "Tenant ID, shop name, and address are required",
//     });
//   }

//   // Verify tenant exists and is active
//   const [tenantCheck] = await db.query(
//     `SELECT id, name, domain FROM tenants WHERE id = ? AND status = 'active'`,
//     [tenantId]
//   );

//   if (!tenantCheck.length) {
//     return res.status(404).json({ message: "Invalid or inactive tenant" });
//   }

//   // Check for duplicate shop name within tenant
//   const [existing] = await db.query(
//     `SELECT id FROM shops WHERE tenant_id = ? AND name = ?`,
//     [tenantId, name]
//   );

//   if (existing.length) {
//     return res.status(409).json({
//       message: "Shop name already exists for this tenant",
//     });
//   }

//   const shopId = genId();

//   try {
//     await db.query(
//       `INSERT INTO shops (id, tenant_id, name, address, phone, status)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [shopId, tenantId, name, JSON.stringify(address), phone, status]
//     );

//     // Return complete shop data with tenant info
//     const newShop = {
//       id: shopId,
//       tenant_id: tenantId,
//       name,
//       address,
//       phone,
//       status,
//       tenant_name: tenantCheck[0].name,
//       tenant_domain: tenantCheck[0].domain,
//       created_at: new Date().toISOString(),
//     };

//     res.status(201).json({
//       message: "Shop created successfully",
//       shop: newShop,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Error creating shop",
//       error: err.message,
//     });
//   }
// };

// // LIST/SEARCH SHOPS (Enhanced with better error handling)
// export const listShops = async (req, res) => {
//   const { role } = req.user;
//   const { search, status, tenantId } = req.query;

//   // Only global users can view all shops
//   if (role !== "global") {
//     return res.status(403).json({
//       message: "Only global users can view shops",
//     });
//   }

//   let whereClause = "1=1";
//   const params = [];

//   // Filter by tenant if provided
//   if (tenantId && tenantId !== "all") {
//     whereClause += " AND s.tenant_id = ?";
//     params.push(tenantId);
//   }

//   // Search functionality (enhanced)
//   if (search && search.trim()) {
//     whereClause += ` AND (
//       LOWER(s.name) LIKE ? OR
//       LOWER(t.name) LIKE ? OR
//       LOWER(t.domain) LIKE ? OR
//       LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.city'))) LIKE ? OR
//       LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.street'))) LIKE ? OR
//       LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.country'))) LIKE ?
//     )`;
//     const searchTerm = `%${search.toLowerCase().trim()}%`;
//     params.push(
//       searchTerm,
//       searchTerm,
//       searchTerm,
//       searchTerm,
//       searchTerm,
//       searchTerm
//     );
//   }

//   // Filter by status
//   if (status && status !== "all") {
//     whereClause += " AND s.status = ?";
//     params.push(status);
//   }

//   try {
//     const [shops] = await db.query(
//       `SELECT s.*, t.name as tenant_name, t.domain as tenant_domain
//        FROM shops s
//        JOIN tenants t ON s.tenant_id = t.id
//        WHERE ${whereClause}
//        ORDER BY s.created_at DESC`,
//       params
//     );

//     // Parse JSON address field and ensure proper data structure
//     const processedShops = shops.map((shop) => ({
//       ...shop,
//       address: JSON.parse(shop.address || "{}"),
//       // Ensure tenant_name is always present
//       tenant_name: shop.tenant_name || "Unknown Tenant",
//       tenant_domain: shop.tenant_domain || null,
//     }));

//     res.json({ shops: processedShops });
//   } catch (err) {
//     console.error("Error fetching shops:", err);
//     res.status(500).json({
//       message: "Error fetching shops",
//       error: err.message,
//     });
//   }
// };

// LIST/SEARCH SHOPS - Fixed Query
export const listShops = async (req, res) => {
  const { role } = req.user;
  const { search, status, tenantId } = req.query;

  console.log("🔍 Shop List Request:", { role, search, status, tenantId });

  // Only global users can view all shops
  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can view shops",
    });
  }

  let whereClause = "t.status = 'active'"; // Only show active tenants
  const params = [];

  // Filter by tenant if provided
  if (tenantId && tenantId !== "all") {
    whereClause += " AND s.tenant_id = ?";
    params.push(tenantId);
  }

  // Search functionality (enhanced)
  if (search && search.trim()) {
    whereClause += ` AND (
      LOWER(s.name) LIKE ? OR 
      LOWER(t.name) LIKE ? OR 
      LOWER(t.domain) LIKE ? OR
      LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.city'))) LIKE ? OR
      LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.street'))) LIKE ? OR
      LOWER(JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.country'))) LIKE ?
    )`;
    const searchTerm = `%${search.toLowerCase().trim()}%`;
    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    );
  }

  // Filter by shop status
  if (status && status !== "all") {
    whereClause += " AND s.status = ?";
    params.push(status);
  }

  try {
    console.log("🗃️ Database Query:", {
      whereClause,
      params,
      query: `
        SELECT 
          s.id, s.tenant_id, s.name, s.address, s.phone, s.status, s.created_at,
          t.name as tenant_name, 
          t.domain as tenant_domain,
          t.status as tenant_status
        FROM shops s
        INNER JOIN tenants t ON s.tenant_id = t.id
        WHERE ${whereClause}
        ORDER BY s.created_at DESC
      `,
    });

    const [shops] = await db.query(
      `
      SELECT 
        s.id, s.tenant_id, s.name, s.address, s.phone, s.status, s.created_at,
        t.name as tenant_name, 
        t.domain as tenant_domain,
        t.status as tenant_status
      FROM shops s
      INNER JOIN tenants t ON s.tenant_id = t.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
    `,
      params
    );

    console.log("📊 Raw Database Results:", shops.length);

    // Parse JSON address field and ensure proper data structure
    const processedShops = shops.map((shop) => {
      let parsedAddress = {};
      try {
        parsedAddress =
          typeof shop.address === "string"
            ? JSON.parse(shop.address)
            : shop.address || {};
      } catch (e) {
        console.error("Address parsing error for shop:", shop.id, e);
        parsedAddress = {};
      }

      return {
        ...shop,
        address: parsedAddress,
        tenant_name: shop.tenant_name || "Unknown Tenant",
        tenant_domain: shop.tenant_domain || null,
      };
    });

    console.log("✅ Processed Shops:", processedShops.length);

    res.json({
      shops: processedShops,
      totalCount: processedShops.length,
      filters: { search, status, tenantId },
    });
  } catch (err) {
    console.error("❌ Error fetching shops:", err);
    res.status(500).json({
      message: "Error fetching shops",
      error: err.message,
      sqlError: err.sqlMessage || null,
    });
  }
};

// GET ACTIVE TENANTS - Fixed Query
export const getActiveTenants = async (req, res) => {
  const { role } = req.user;

  console.log("🏢 Tenants Request:", { role });

  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can access tenant data",
    });
  }

  try {
    const [tenants] = await db.query(`
      SELECT 
        id, name, domain, status, created_at,
        (SELECT COUNT(*) FROM shops WHERE tenant_id = tenants.id) as shop_count
      FROM tenants 
      WHERE status = 'active' 
      ORDER BY name ASC
    `);

    console.log("🏢 Found Tenants:", tenants.length);
    console.log(
      "🏢 Tenant Details:",
      tenants.map((t) => ({ id: t.id, name: t.name, shop_count: t.shop_count }))
    );

    res.json({
      tenants,
      totalCount: tenants.length,
    });
  } catch (err) {
    console.error("❌ Error fetching tenants:", err);
    res.status(500).json({
      message: "Error fetching tenants",
      error: err.message,
      sqlError: err.sqlMessage || null,
    });
  }
};

// CREATE SHOP - Enhanced with better error handling
export const createShop = async (req, res) => {
  const { tenantId, name, address, phone, status = "active" } = req.body;
  const { role, userId } = req.user;

  console.log("🏪 Create Shop Request:", { tenantId, name, role, userId });

  // Only global users can create shops
  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can create shops",
    });
  }

  if (!tenantId || !name || !address) {
    return res.status(400).json({
      message: "Tenant ID, shop name, and address are required",
      received: { tenantId: !!tenantId, name: !!name, address: !!address },
    });
  }

  try {
    // Verify tenant exists and is active
    const [tenantCheck] = await db.query(
      `SELECT id, name, domain FROM tenants WHERE id = ? AND status = 'active'`,
      [tenantId]
    );

    if (!tenantCheck.length) {
      return res.status(404).json({
        message: "Invalid or inactive tenant",
        tenantId,
      });
    }

    console.log("✅ Tenant Verified:", tenantCheck[0]);

    // Check for duplicate shop name within tenant
    const [existing] = await db.query(
      `SELECT id FROM shops WHERE tenant_id = ? AND LOWER(name) = LOWER(?)`,
      [tenantId, name.trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "Shop name already exists for this tenant",
        existingShopId: existing[0].id,
      });
    }

    const shopId = genId();

    // Insert new shop
    await db.query(
      `
      INSERT INTO shops (id, tenant_id, name, address, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [shopId, tenantId, name.trim(), JSON.stringify(address), phone, status]
    );

    console.log("✅ Shop Created:", shopId);

    // Return complete shop data with tenant info
    const newShop = {
      id: shopId,
      tenant_id: tenantId,
      name: name.trim(),
      address,
      phone,
      status,
      tenant_name: tenantCheck[0].name,
      tenant_domain: tenantCheck[0].domain,
      created_at: new Date().toISOString(),
    };

    res.status(201).json({
      message: "Shop created successfully",
      shop: newShop,
    });
  } catch (err) {
    console.error("❌ Shop creation error:", err);
    res.status(500).json({
      message: "Error creating shop",
      error: err.message,
      sqlError: err.sqlMessage || null,
    });
  }
};

// GET SINGLE SHOP (Enhanced)
export const getShop = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can view shop details",
    });
  }

  try {
    const [shops] = await db.query(
      `SELECT s.*, t.name as tenant_name, t.domain as tenant_domain
       FROM shops s
       JOIN tenants t ON s.tenant_id = t.id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );

    if (!shops.length) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const shop = shops[0];
    shop.address = JSON.parse(shop.address || "{}");

    res.json(shop);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching shop",
      error: err.message,
    });
  }
};

// UPDATE SHOP (Enhanced)
export const updateShop = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, status } = req.body;
  const { role } = req.user;

  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can update shops",
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Shop name is required" });
  }

  try {
    // Get current shop info with tenant data
    const [currentShop] = await db.query(
      `SELECT s.tenant_id, t.name as tenant_name 
       FROM shops s 
       JOIN tenants t ON s.tenant_id = t.id 
       WHERE s.id = ?`,
      [id]
    );

    if (!currentShop.length) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check for duplicate name within same tenant (excluding current shop)
    const [existing] = await db.query(
      `SELECT id FROM shops 
       WHERE tenant_id = ? AND name = ? AND id != ?`,
      [currentShop[0].tenant_id, name.trim(), id]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "Shop name already exists for this tenant",
      });
    }

    const [result] = await db.query(
      `UPDATE shops 
       SET name = ?, address = ?, phone = ?, status = ?
       WHERE id = ?`,
      [name.trim(), JSON.stringify(address), phone, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json({ message: "Shop updated successfully" });
  } catch (err) {
    console.error("Error updating shop:", err);
    res.status(500).json({
      message: "Error updating shop",
      error: err.message,
    });
  }
};

// DELETE SHOP (Enhanced with better validation)
export const deleteShop = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can delete shops",
    });
  }

  try {
    // First check if shop exists
    const [shopExists] = await db.query(`SELECT name FROM shops WHERE id = ?`, [
      id,
    ]);

    if (!shopExists.length) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check if shop has associated users
    const [userCount] = await db.query(
      `SELECT COUNT(*) as count FROM user_shops WHERE shop_id = ?`,
      [id]
    );

    if (userCount[0].count > 0) {
      return res.status(409).json({
        message: `Cannot delete shop "${shopExists[0].name}". It has ${userCount[0].count} assigned user(s). Please reassign users first.`,
      });
    }

    const [result] = await db.query(`DELETE FROM shops WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json({
      message: `Shop "${shopExists[0].name}" deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting shop:", err);
    res.status(500).json({
      message: "Error deleting shop",
      error: err.message,
    });
  }
};

// GET ACTIVE TENANTS (Enhanced with better data)
// export const getActiveTenants = async (req, res) => {
//   const { role } = req.user;

//   if (role !== "global") {
//     return res.status(403).json({
//       message: "Only global users can access tenant data",
//     });
//   }

//   try {
//     const [tenants] = await db.query(
//       `SELECT id, name, domain, status, created_at
//        FROM tenants
//        WHERE status = 'active'
//        ORDER BY name ASC`
//     );

//     res.json({ tenants });
//   } catch (err) {
//     console.error("Error fetching tenants:", err);
//     res.status(500).json({
//       message: "Error fetching tenants",
//       error: err.message,
//     });
//   }
// };

// GET SHOP STATISTICS
export const getShopStats = async (req, res) => {
  const { role } = req.user;

  if (role !== "global") {
    return res.status(403).json({
      message: "Only global users can access shop statistics",
    });
  }

  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_shops,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_shops,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_shops,
        COUNT(DISTINCT tenant_id) as unique_tenants,
        COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(address, '$.city'))) as unique_cities
      FROM shops
    `);

    res.json({ stats: stats[0] });
  } catch (err) {
    console.error("Error fetching shop statistics:", err);
    res.status(500).json({
      message: "Error fetching shop statistics",
      error: err.message,
    });
  }
};
