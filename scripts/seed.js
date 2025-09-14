// scripts/seed.js
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../Utils/db.js";

dotenv.config();

async function seed() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const tenantId = crypto.randomUUID(); // tenant slug: myshop
    await conn.query(
      "INSERT INTO tenants (id, name, domain, status) VALUES (?, ?, ?, ?)",
      [
        tenantId,
        "My Shop Demo",
        "myshop", // this is the tenantIdentifier (slug)
        "active",
      ]
    );

    const adminId = crypto.randomUUID();
    const passHash = await bcrypt.hash("admin123", 10);

    await conn.query(
      `INSERT INTO users (id, tenant_id, role, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        tenantId,
        "admin",
        "admin@myshop.com",
        passHash,
        "Admin",
        "MyShop",
        1,
      ]
    );

    await conn.commit();
    console.log("Seed done. tenant:", {
      tenantId,
      tenantSlug: "myshop",
      adminEmail: "admin@myshop.com",
      adminPassword: "admin123",
    });
  } catch (err) {
    await conn.rollback();
    console.error("Seed failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
