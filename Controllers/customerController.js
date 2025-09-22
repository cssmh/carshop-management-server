import {
  genId,
  ensureTags,
  fetchCustomerAggregate,
  fetchRemarks,
} from "../services/customerService.js";
import db from "../Utils/db.js";

/**
 * Helper to parse JSON fields when body is multipart/form-data.
 * Arrays (addresses, maritalInfo, etc.) should be sent as JSON strings.
 */
function parseArrayField(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const createCustomer = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const shopId = req.user?.shopId || null;

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context missing" });
  }

  // Extract fields
  const {
    type = "Individual",
    salutation,
    firstName,
    lastName,
    nickname,
    businessName,
    legalName,
    gender,
    dateOfBirth,
    taxId,
    stateId,
    educationLevel,
    email,
    billingEmail,
    telephone,
    mobile,
    whatsapp,
    facebook,
    instagram,
    x,
    group,
    subgroup,
    taxExempt,
    taxExemptionReason,
    priceList,
    terms,
    leadSource,
    status = "Active",
  } = req.body;

  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ message: "firstName, lastName and email are required" });
  }

  const addresses = parseArrayField(req.body.addresses, []);
  const maritalInfo = parseArrayField(req.body.maritalInfo, []);
  const authorizedInfo = parseArrayField(req.body.authorizedInfo, []);
  const referenceInfo = parseArrayField(req.body.referenceInfo, []);
  const employmentInfo = parseArrayField(req.body.employmentInfo, []);
  const assetInfo = parseArrayField(req.body.assetInfo, []);
  // tags might come as comma string or json
  let tags = req.body.tags;
  if (typeof tags === "string") {
    try {
      const maybe = JSON.parse(tags);
      if (Array.isArray(maybe)) tags = maybe;
      else tags = tags.split(",").map((t) => t.trim());
    } catch {
      tags = tags.split(",").map((t) => t.trim());
    }
  }
  if (!Array.isArray(tags)) tags = [];

  const profilePath = req.file
    ? `/uploads/customer_profiles/${req.file.filename}`
    : null;

  const customerId = genId();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO customers (
        id, tenant_id, shop_id, type, salutation, first_name, last_name, nickname,
        business_name, legal_name, gender, date_of_birth, tax_id, state_id, education_level,
        email, billing_email, telephone, mobile, whatsapp, facebook, instagram, x_handle,
        group_name, subgroup_name, tax_exempt, tax_exemption_reason, price_list, terms,
        lead_source, status, profile_picture_path
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customerId,
        tenantId,
        shopId,
        type,
        salutation || null,
        firstName,
        lastName,
        nickname || null,
        businessName || null,
        legalName || null,
        gender || null,
        dateOfBirth || null,
        taxId || null,
        stateId || null,
        educationLevel || null,
        email,
        billingEmail || null,
        telephone || null,
        mobile || null,
        whatsapp || null,
        facebook || null,
        instagram || null,
        x || null,
        group || null,
        subgroup || null,
        taxExempt ? 1 : 0,
        taxExemptionReason || null,
        priceList || null,
        terms || null,
        leadSource || null,
        status,
        profilePath,
      ]
    );

    // Addresses
    for (const addr of addresses) {
      await conn.query(
        `INSERT INTO customer_addresses 
          (id, customer_id, type, attention_to, address_line1, address_line2, complement, city, state, zip, country)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          genId(),
          customerId,
          addr.type || "Home",
          addr.attentionTo || null,
          addr.addressLine1 || null,
          addr.addressLine2 || null,
          addr.complement || null,
          addr.city || null,
          addr.state || null,
          addr.zip || null,
          addr.country || null,
        ]
      );
    }

    // Generic attributes
    const saveAttr = async (list, category) => {
      for (const item of list) {
        if (!item.property) continue;
        await conn.query(
          `INSERT INTO customer_attributes (id, customer_id, category, property_key, property_value)
           VALUES (?,?,?,?,?)`,
          [genId(), customerId, category, item.property, item.value || null]
        );
      }
    };
    await saveAttr(maritalInfo, "marital");
    await saveAttr(authorizedInfo, "authorized");
    await saveAttr(referenceInfo, "reference");
    await saveAttr(employmentInfo, "employment");

    // Vehicles
    for (const v of assetInfo) {
      await conn.query(
        `INSERT INTO customer_vehicles (
          id, customer_id, vehicle_type, plate_number, vin, manufacturing_year,
          model_year, color, make, model, style, engine, odometer
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          genId(),
          customerId,
          v.vehicleType || "Passenger",
          v.plateNumber || null,
          v.vin || null,
          v.manufacturingYear || null,
          v.modelYear || null,
          v.color || null,
          v.make || null,
          v.model || null,
          v.style || null,
          v.engine || null,
          v.odometer || null,
        ]
      );
    }

    // Tags
    const tagIds = await ensureTags(tenantId, tags, conn);
    for (const tid of tagIds) {
      await conn.query(
        "INSERT INTO customer_tags (customer_id, tag_id) VALUES (?,?)",
        [customerId, tid]
      );
    }

    await conn.commit();
    const aggregate = await fetchCustomerAggregate(tenantId, customerId);
    res.status(201).json({ message: "Customer created", customer: aggregate });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

export const getCustomerById = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;
  try {
    const customer = await fetchCustomerAggregate(tenantId, id);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json({ customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * List + Search
 * Query params supported:
 *  q= (search in name, email, business, tags)
 *  status=Active|Inactive
 *  type=Individual|Business
 *  tag=singleTagName
 *  vehicleVin=VIN
 *  page, limit (pagination)
 *  sort=created_at|last_name
 *  order=asc|desc
 */
export const listCustomers = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const {
    q,
    status,
    type,
    tag,
    vehicleVin,
    page = 1,
    limit = 20,
    sort = "created_at",
    order = "desc",
  } = req.query;

  const allowedSort = new Set(["created_at", "last_name", "first_name"]);
  const safeSort = allowedSort.has(sort) ? sort : "created_at";
  const safeOrder = order?.toLowerCase() === "asc" ? "ASC" : "DESC";
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchLimit = Math.min(parseInt(limit), 100); // Cap limit at 100

  const params = [tenantId];
  let where = "c.tenant_id = ? AND c.deleted_at IS NULL";
  let useFullText = false;

  if (status) {
    where += " AND c.status = ?";
    params.push(status);
  }
  if (type) {
    where += " AND c.type = ?";
    params.push(type);
  }

  // Enhanced search logic
  if (q) {
    const searchTerm = q.trim();

    // Use full-text search for longer queries (better performance)
    if (searchTerm.length >= 3) {
      useFullText = true;
      where +=
        " AND MATCH(c.first_name, c.last_name, c.email, c.business_name) AGAINST(? IN BOOLEAN MODE)";
      params.push(`+${searchTerm}*`); // Prefix search with boolean mode
    } else {
      // Use LIKE for shorter queries
      where +=
        " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)";
      const like = `${searchTerm}%`; // Prefix search is faster than %term%
      params.push(like, like, like);
    }
  }

  if (vehicleVin) {
    where +=
      " AND EXISTS (SELECT 1 FROM customer_vehicles v WHERE v.customer_id = c.id AND v.vin = ?)";
    params.push(vehicleVin);
  }
  if (tag) {
    where +=
      " AND EXISTS (SELECT 1 FROM customer_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.customer_id = c.id AND t.name = ? AND t.tenant_id = c.tenant_id)";
    params.push(tag);
  }

  // Optimized query - only fetch necessary fields for listing
  const sql = `
    SELECT 
      c.id, c.first_name, c.last_name, c.email, c.mobile, c.status, c.type,
      c.business_name, c.profile_picture_path, c.created_at
    FROM customers c
    WHERE ${where}
    ORDER BY c.${safeSort} ${safeOrder}
    LIMIT ? OFFSET ?
  `;
  params.push(searchLimit, offset);

  // Optimized count query
  const countSql = `
    SELECT COUNT(*) as total 
    FROM customers c 
    WHERE ${where}
  `;

  try {
    const conn = await db.getConnection();
    try {
      // Use Promise.all for parallel execution
      const [countResult, dataResult] = await Promise.all([
        conn.query(countSql, params.slice(0, params.length - 2)),
        conn.query(sql, params),
      ]);

      const [[countRow]] = countResult;
      const [rows] = dataResult;

      // Enhanced response with performance hints
      res.json({
        page: parseInt(page),
        limit: searchLimit,
        total: countRow.total,
        searchTerm: q || null,
        searchMethod: useFullText ? "fulltext" : "like",
        data: rows.map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          mobile: r.mobile,
          status: r.status,
          type: r.type,
          businessName: r.business_name,
          profilePicture: r.profile_picture_path,
          createdAt: r.created_at,
        })),
        performance: {
          cached: false, // You can add Redis caching here
          queryTime: Date.now(), // You can measure actual query time
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Customer search error:", err);
    res.status(500).json({
      message: "Search failed",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};

export const updateCustomer = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;

  // Validate existence
  const existing = await fetchCustomerAggregate(tenantId, id);
  if (!existing) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const {
    type,
    salutation,
    firstName,
    lastName,
    nickname,
    businessName,
    legalName,
    gender,
    dateOfBirth,
    taxId,
    stateId,
    educationLevel,
    email,
    billingEmail,
    telephone,
    mobile,
    whatsapp,
    facebook,
    instagram,
    x,
    group,
    subgroup,
    taxExempt,
    taxExemptionReason,
    priceList,
    terms,
    leadSource,
    status,
  } = req.body;

  const addresses = parseArrayField(req.body.addresses, []);
  const maritalInfo = parseArrayField(req.body.maritalInfo, []);
  const authorizedInfo = parseArrayField(req.body.authorizedInfo, []);
  const referenceInfo = parseArrayField(req.body.referenceInfo, []);
  const employmentInfo = parseArrayField(req.body.employmentInfo, []);
  const assetInfo = parseArrayField(req.body.assetInfo, []);

  let tags = req.body.tags;
  if (typeof tags === "string") {
    try {
      const maybe = JSON.parse(tags);
      if (Array.isArray(maybe)) tags = maybe;
      else tags = tags.split(",").map((t) => t.trim());
    } catch {
      tags = tags.split(",").map((t) => t.trim());
    }
  }
  if (!Array.isArray(tags)) tags = [];

  const newProfile = req.file
    ? `/uploads/customer_profiles/${req.file.filename}`
    : existing.profilePicture;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE customers SET
        type=?, salutation=?, first_name=?, last_name=?, nickname=?, business_name=?, legal_name=?,
        gender=?, date_of_birth=?, tax_id=?, state_id=?, education_level=?,
        email=?, billing_email=?, telephone=?, mobile=?, whatsapp=?, facebook=?, instagram=?, x_handle=?,
        group_name=?, subgroup_name=?, tax_exempt=?, tax_exemption_reason=?, price_list=?, terms=?, lead_source=?,
        status=?, profile_picture_path=? 
       WHERE id=? AND tenant_id=? AND deleted_at IS NULL`,
      [
        type || existing.type,
        salutation || null,
        firstName || existing.firstName,
        lastName || existing.lastName,
        nickname || null,
        businessName || null,
        legalName || null,
        gender || null,
        dateOfBirth || null,
        taxId || null,
        stateId || null,
        educationLevel || null,
        email || existing.email,
        billingEmail || null,
        telephone || null,
        mobile || null,
        whatsapp || null,
        facebook || null,
        instagram || null,
        x || null,
        group || null,
        subgroup || null,
        taxExempt ? 1 : 0,
        taxExemptionReason || null,
        priceList || null,
        terms || null,
        leadSource || null,
        status || existing.status,
        newProfile,
        id,
        tenantId,
      ]
    );

    // Replace addresses
    await conn.query("DELETE FROM customer_addresses WHERE customer_id = ?", [
      id,
    ]);
    for (const addr of addresses) {
      await conn.query(
        `INSERT INTO customer_addresses 
          (id, customer_id, type, attention_to, address_line1, address_line2, complement, city, state, zip, country)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          genId(),
          id,
          addr.type || "Home",
          addr.attentionTo || null,
          addr.addressLine1 || null,
          addr.addressLine2 || null,
          addr.complement || null,
          addr.city || null,
          addr.state || null,
          addr.zip || null,
          addr.country || null,
        ]
      );
    }

    // Replace attributes
    await conn.query("DELETE FROM customer_attributes WHERE customer_id = ?", [
      id,
    ]);
    const saveAttr = async (list, category) => {
      for (const item of list) {
        if (!item.property) continue;
        await conn.query(
          `INSERT INTO customer_attributes (id, customer_id, category, property_key, property_value)
           VALUES (?,?,?,?,?)`,
          [genId(), id, category, item.property, item.value || null]
        );
      }
    };
    await saveAttr(maritalInfo, "marital");
    await saveAttr(authorizedInfo, "authorized");
    await saveAttr(referenceInfo, "reference");
    await saveAttr(employmentInfo, "employment");

    // Replace vehicles
    await conn.query("DELETE FROM customer_vehicles WHERE customer_id = ?", [
      id,
    ]);
    for (const v of assetInfo) {
      await conn.query(
        `INSERT INTO customer_vehicles (
          id, customer_id, vehicle_type, plate_number, vin, manufacturing_year,
          model_year, color, make, model, style, engine, odometer
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          genId(),
          id,
          v.vehicleType || "Passenger",
          v.plateNumber || null,
          v.vin || null,
          v.manufacturingYear || null,
          v.modelYear || null,
          v.color || null,
          v.make || null,
          v.model || null,
          v.style || null,
          v.engine || null,
          v.odometer || null,
        ]
      );
    }

    // Tags
    await conn.query("DELETE FROM customer_tags WHERE customer_id = ?", [id]);
    const tagIds = await ensureTags(tenantId, tags, conn);
    for (const tid of tagIds) {
      await conn.query(
        "INSERT INTO customer_tags (customer_id, tag_id) VALUES (?,?)",
        [id, tid]
      );
    }

    await conn.commit();
    const aggregate = await fetchCustomerAggregate(tenantId, id);
    res.json({ message: "Customer updated", customer: aggregate });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

export const deleteCustomer = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;
  try {
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(
        "UPDATE customers SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
        [id, tenantId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted (soft)" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* Remarks */

export const addCustomerRemark = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;
  const { parentId = null, body } = req.body;
  const userId = req.user?.id || null;

  if (!body) {
    return res.status(400).json({ message: "Remark body required" });
  }

  // Verify customer
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT id FROM customers WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const remarkId = genId();
    await conn.query(
      `INSERT INTO customer_remarks (id, customer_id, parent_id, user_id, body)
       VALUES (?,?,?,?,?)`,
      [remarkId, id, parentId || null, userId, body]
    );

    const remarks = await fetchRemarks(id);
    res.status(201).json({
      message: "Remark added",
      remarks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

export const listCustomerRemarks = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;
  try {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT id FROM customers WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
        [id, tenantId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }
    } finally {
      conn.release();
    }
    const remarks = await fetchRemarks(id);
    res.json({ remarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
