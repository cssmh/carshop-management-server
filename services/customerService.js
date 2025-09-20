import crypto from "crypto";
import db from "../Utils/db.js";

export function genId() {
  return crypto.randomUUID();
}

/**
 * Inserts / updates tag names and returns tag IDs.
 */
export async function ensureTags(tenantId, tagNames, conn) {
  if (!tagNames || tagNames.length === 0) return [];
  const uniqueNames = [
    ...new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
  ];
  const tagIds = [];

  for (const name of uniqueNames) {
    // Try find
    const [existing] = await conn.query(
      "SELECT id FROM tags WHERE tenant_id = ? AND name = ?",
      [tenantId, name]
    );
    if (existing.length > 0) {
      tagIds.push(existing[0].id);
    } else {
      const id = genId();
      await conn.query(
        "INSERT INTO tags (id, tenant_id, name) VALUES (?,?,?)",
        [id, tenantId, name]
      );
      tagIds.push(id);
    }
  }
  return tagIds;
}

/**
 * Load full customer aggregate
 */
export async function fetchCustomerAggregate(tenantId, id) {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT * FROM customers WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    );
    if (rows.length === 0) return null;
    const customer = rows[0];

    const [addresses] = await conn.query(
      "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY created_at ASC",
      [id]
    );

    const [attributes] = await conn.query(
      "SELECT category, property_key, property_value FROM customer_attributes WHERE customer_id = ?",
      [id]
    );

    const groupedAttr = {
      maritalInfo: [],
      authorizedInfo: [],
      referenceInfo: [],
      employmentInfo: [],
    };
    for (const a of attributes) {
      const key = mapCategoryToFormKey(a.category);
      if (groupedAttr[key]) {
        groupedAttr[key].push({
          property: a.property_key,
          value: a.property_value,
        });
      }
    }

    const [vehicles] = await conn.query(
      "SELECT * FROM customer_vehicles WHERE customer_id = ?",
      [id]
    );

    const [tagRows] = await conn.query(
      `SELECT t.name FROM customer_tags ct 
       JOIN tags t ON t.id = ct.tag_id 
       WHERE ct.customer_id = ?`,
      [id]
    );

    return {
      ...mapDbCustomerToForm(customer),
      addresses: addresses.map(mapAddressRow),
      ...groupedAttr,
      assetInfo: vehicles.map(mapVehicleRow),
      tags: tagRows.map((t) => t.name),
    };
  } finally {
    conn.release();
  }
}

function mapCategoryToFormKey(category) {
  switch (category) {
    case "marital":
      return "maritalInfo";
    case "authorized":
      return "authorizedInfo";
    case "reference":
      return "referenceInfo";
    case "employment":
      return "employmentInfo";
    default:
      return "unknown";
  }
}

function mapDbCustomerToForm(row) {
  return {
    id: row.id,
    type: row.type,
    salutation: row.salutation,
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.nickname,
    businessName: row.business_name,
    legalName: row.legal_name,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    taxId: row.tax_id,
    stateId: row.state_id,
    educationLevel: row.education_level,
    email: row.email,
    billingEmail: row.billing_email,
    telephone: row.telephone,
    mobile: row.mobile,
    whatsapp: row.whatsapp,
    facebook: row.facebook,
    instagram: row.instagram,
    x: row.x_handle,
    group: row.group_name,
    subgroup: row.subgroup_name,
    taxExempt: !!row.tax_exempt,
    taxExemptionReason: row.tax_exemption_reason,
    priceList: row.price_list,
    terms: row.terms,
    leadSource: row.lead_source,
    status: row.status,
    profilePicture: row.profile_picture_path,
    remarks: "", // remarks handled separately
  };
}

function mapAddressRow(r) {
  return {
    type: r.type,
    attentionTo: r.attention_to,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    complement: r.complement,
    city: r.city,
    state: r.state,
    zip: r.zip,
    country: r.country,
  };
}

function mapVehicleRow(r) {
  return {
    vehicleType: r.vehicle_type,
    plateNumber: r.plate_number,
    vin: r.vin,
    manufacturingYear: r.manufacturing_year,
    modelYear: r.model_year,
    color: r.color,
    make: r.make,
    model: r.model,
    style: r.style,
    engine: r.engine,
    odometer: r.odometer,
  };
}

export async function fetchRemarks(customerId) {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT * FROM customer_remarks WHERE customer_id = ? ORDER BY created_at ASC",
      [customerId]
    );
    return buildThread(rows);
  } finally {
    conn.release();
  }
}

function buildThread(rows) {
  const byId = {};
  rows.forEach((r) => (byId[r.id] = { ...r, children: [] }));
  const roots = [];
  rows.forEach((r) => {
    if (r.parent_id && byId[r.parent_id]) {
      byId[r.parent_id].children.push(byId[r.id]);
    } else {
      roots.push(byId[r.id]);
    }
  });
  return roots;
}
