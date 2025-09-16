import crypto from "crypto";
import db from "../Utils/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function genId() {
  return crypto.randomUUID();
}

export const registerTenant = async (req, res) => {
  const { name, domain, adminEmail, adminPassword } = req.body;
  if (!name || !adminEmail || !adminPassword)
    return res.status(400).json({ message: "Missing fields" });

  const tenantId = genId();
  const adminId = genId();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [t] = await conn.query(
      `INSERT INTO tenants (id, name, domain, status) VALUES (?, ?, ?, 'active')`,
      [tenantId, name, domain || null]
    );

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await conn.query(
      `INSERT INTO users (id, tenant_id, role, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [adminId, tenantId, "admin", adminEmail, passwordHash, "Admin", "User"]
    );

    await conn.commit();
    res.json({ message: "Tenant and admin created", tenantId, adminId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

export const login = async (req, res) => {
  const { tenantIdentifier, email, password } = req.body;

  // tenantIdentifier can be tenant domain/slug or tenant id
  if (!tenantIdentifier || !email || !password)
    return res.status(400).json({ message: "Missing fields" });
  const conn = await db.getConnection();
  try {
    // find tenant
    const [tenants] = await conn.query(
      `SELECT id FROM tenants WHERE domain = ? OR id = ? LIMIT 1`,
      [tenantIdentifier, tenantIdentifier]
    );

    if (!tenants || tenants.length === 0)
      return res.status(400).json({ message: "Tenant not found" });

    const tenant = tenants[0];

    // find user under that tenant
    const [users] = await conn.query(
      `SELECT id, tenant_id, role, password_hash, first_name, last_name, is_active FROM users WHERE email = ? AND tenant_id = ? LIMIT 1`,
      [email, tenant.id]
    );

    if (!users || users.length === 0)
      return res.status(400).json({ message: "User not found" });
    const user = users[0];

    if (!user.is_active)
      return res.status(403).json({ message: "User disabled" });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // if token created token then update the token
    if (token) {
      await db.query(
        `UPDATE users SET token = ? WHERE email = ? AND id = ? AND tenant_id = ?  LIMIT 1`,
        [token, email, user.id, tenant.id]
      );
    }

    // Set the token as a cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
      },
      token: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

// export async function me(req, res) {
//   console.log(req.user);

//   // auth middleware already set req.user
//   return res.json({ user: req.user });
// }

export async function me(req, res) {
  try {
    const userReq = req.user;
    const { id, tenantId } = userReq;

    // fetch user info from DB
    const [users] = await db.query(
      `SELECT id, first_name, last_name, email, phone, is_active, role 
       FROM users 
       WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [id, tenantId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    console.log(user);

    // return clean user object
    return res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        is_active: user.is_active,
        role: user.role,
        tenantId,
      },
    });
  } catch (err) {
    console.error("me() error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export const logout = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      // remove token from DB
      await db.query(`UPDATE users SET token = NULL WHERE token = ?`, [token]);
    }

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout error" });
  }
};
