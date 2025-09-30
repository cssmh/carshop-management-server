import db from "../../Utils/db.js";

// Add new towing company
export const addTowingCompany = async (req, res) => {
  try {
    const { userId, tenantId, shopId } = req.user;
    const form = req.body;

    // Insert towing company
    const [result] = await db.query(
      `INSERT INTO towing_companies (
        user_id, tenant_id, shop_id, name, code, contact_person, phone, emergency_phone, email, website,
        street, city, state, zip_code, country,
        fleet_size, response_time, availability,
        rates_hookup, rates_per_mile, rates_storage, rates_after_hours,
        payment_terms, rating, contract_start, contract_end,
        is_active, is_preferred, is_priority, logo, notes, service_areas, services, certifications, special_equipment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tenantId,
        shopId,
        form.name,
        form.code,
        form.contactPerson,
        form.phone,
        form.emergencyPhone,
        form.email,
        form.website,
        form.address.street,
        form.address.city,
        form.address.state,
        form.address.zipCode,
        form.address.country,
        form.fleetSize,
        form.responseTime,
        form.availability,
        form.rates.hookup,
        form.rates.perMile,
        form.rates.storage,
        form.rates.afterHours,
        form.paymentTerms,
        form.rating,
        form.contractStartDate,
        form.contractEndDate,
        form.isActive ? 1 : 0,
        form.isPreferred ? 1 : 0,
        form.isPriority ? 1 : 0,
        form.logo,
        form.notes,
        JSON.stringify(form.serviceAreas),
        JSON.stringify(form.services),
        JSON.stringify(form.certifications),
        JSON.stringify(form.specialEquipment),
      ]
    );

    res
      .status(201)
      .json({ message: "Towing company added", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all towing companies for the user's shop/tenant
export const getTowingCompanies = async (req, res) => {
  try {
    const { userId, tenantId, shopId } = req.user;

    // You can filter by tenantId/shopId/userId as per your logic
    const [rows] = await db.query(
      `SELECT * FROM towing_companies WHERE shop_id = ?`,
      [shopId]
    );

    // Parse JSON fields and transform to frontend format
    const companies = rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      contactPerson: row.contact_person,
      phone: row.phone,
      emergencyPhone: row.emergency_phone,
      email: row.email,
      website: row.website,
      address: {
        street: row.street,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        country: row.country,
      },
      serviceAreas: JSON.parse(row.service_areas || "[]"),
      services: JSON.parse(row.services || "{}"),
      fleetSize: row.fleet_size,
      responseTime: row.response_time,
      availability: row.availability,
      rates: {
        hookup: row.rates_hookup,
        perMile: row.rates_per_mile,
        storage: row.rates_storage,
        afterHours: row.rates_after_hours,
      },
      paymentTerms: row.payment_terms,
      rating: parseFloat(row.rating) || 5,
      contractStartDate: row.contract_start,
      contractEndDate: row.contract_end,
      isActive: !!row.is_active,
      isPreferred: !!row.is_preferred,
      isPriority: !!row.is_priority,
      logo: row.logo,
      notes: row.notes,
      certifications: JSON.parse(row.certifications || "[]"),
      specialEquipment: JSON.parse(row.special_equipment || "[]"),
      // Default values for frontend compatibility
      totalJobs: 0,
      completedJobs: 0,
      avgResponseTime: "N/A",
      lastServiceDate: null,
    }));

    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Delete a towing company
export const deleteTowingCompany = async (req, res) => {
  try {
    const { userId, tenantId, shopId } = req.user;
    const { id } = req.params;

    // Only allow delete if company belongs to this user/shop/tenant
    await db.query(
      `DELETE FROM towing_companies WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
