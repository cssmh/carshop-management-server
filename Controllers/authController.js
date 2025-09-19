import crypto from "crypto";
import db from "../Utils/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function genId() {
  return crypto.randomUUID();
}

export const registerTenant = async (req, res) => {
  const { name, domain, adminEmail, adminPassword, shopName } = req.body;
  if (!name || !adminEmail || !adminPassword)
    return res.status(400).json({ message: "Missing fields" });

  const tenantId = genId();
  const adminId = genId();
  const shopId = genId();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    // Create tenant
    await conn.query(
      `INSERT INTO tenants (id, name, domain, status) VALUES (?, ?, ?, 'active')`,
      [tenantId, name, domain || null]
    );
    // Create default shop for the tenant
    await conn.query(
      `INSERT INTO shops (id, tenant_id, name, status) VALUES (?, ?, ?, 'active')`,
      [shopId, tenantId, shopName || `${name} Main Shop`]
    );

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await conn.query(
      `INSERT INTO users (id, role, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [adminId, "admin", adminEmail, passwordHash, "Admin", "User"]
    );

    // Link user to tenant
    await conn.query(
      `INSERT INTO user_tenants (user_id, tenant_id, is_default) VALUES (?, ?, TRUE)`,
      [adminId, tenantId]
    );

    // Link user to shop
    await conn.query(
      `INSERT INTO user_shops (user_id, shop_id, is_default) VALUES (?, ?, TRUE)`,
      [adminId, shopId]
    );

    await conn.commit();
    res.status(200).json({
      message: "Tenant, shop, and admin created successfully",
      tenantId,
      shopId,
      adminId,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    conn.release();
  }
};

export const login = async (req, res) => {
  const { email, password, tenantIdentifier, shopId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    // Find user by email
    const [users] = await db.query(
      `SELECT id, email, first_name, last_name, role, password_hash, is_active
       FROM users 
       WHERE email = ? AND is_active = 1
       LIMIT 1`,
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "User is disabled" });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Get user's tenants
    const [userTenants] = await db.query(
      `SELECT t.id, t.name, t.domain, ut.is_default
       FROM tenants t
       JOIN user_tenants ut ON t.id = ut.tenant_id
       WHERE ut.user_id = ? AND t.status = 'active'
       ORDER BY ut.is_default DESC`,
      [user.id]
    );

    if (!userTenants || userTenants.length === 0) {
      return res
        .status(403)
        .json({ message: "User has no access to any tenants" });
    }

    // If no specific tenant selected, check if user has multiple tenants
    if (!tenantIdentifier) {
      if (userTenants.length > 1) {
        // Multiple tenants - return list for selection
        return res.status(200).json({
          companies: userTenants,
          multiTenant: true,
          step: "select_company",
        });
      } else {
        // Single tenant - check shops
        const selectedTenant = userTenants[0];
        return await checkShopsAndRespond(user, selectedTenant.id, res);
      }
    } else {
      // Specific tenant selected - validate access
      const selectedTenant = userTenants.find((t) => t.id === tenantIdentifier);
      if (!selectedTenant) {
        return res
          .status(403)
          .json({ message: "Access denied to selected tenant" });
      }
      // If shopId is provided, complete login
      if (shopId) {
        return await completeLogin(user, tenantIdentifier, shopId, res);
      } else {
        // Check shops for the selected tenant
        return await checkShopsAndRespond(user, tenantIdentifier, res);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to check shops and respond accordingly
async function checkShopsAndRespond(user, tenantId, res) {
  try {
    // Get user's shops for the selected tenant
    const [userShops] = await db.query(
      `SELECT s.id, s.name, s.address, s.phone, us.is_default
       FROM shops s
       JOIN user_shops us ON s.id = us.shop_id
       WHERE us.user_id = ? AND s.tenant_id = ? AND s.status = 'active'
       ORDER BY us.is_default DESC`,
      [user.id, tenantId]
    );
    if (!userShops || userShops.length === 0) {
      return res
        .status(403)
        .json({ message: "User has no access to any shops" });
    }

    if (userShops.length > 1) {
      // Multiple shops - return list for selection
      return res.status(200).json({
        shops: userShops,
        multiShop: true,
        step: "select_shop",
        tenantId: tenantId,
      });
    } else {
      // Single shop - complete login
      const defaultShop = userShops[0];
      return await completeLogin(user, tenantId, defaultShop.id, res);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Helper function to complete login process
async function completeLogin(user, tenantId, shopId, res) {
  try {
    // Get shop details
    const [shops] = await db.query(
      `SELECT s.id, s.name, s.address, s.phone
       FROM shops s
       WHERE s.id = ? AND s.tenant_id = ? AND s.status = 'active'`,
      [shopId, tenantId]
    );

    if (!shops || shops.length === 0) {
      return res.status(403).json({ message: "Invalid shop selection" });
    }

    const selectedShop = shops[0];

    // Get tenant details
    const [tenants] = await db.query(
      `SELECT name, domain FROM tenants WHERE id = ?`,
      [tenantId]
    );

    const tenant = tenants[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        userEmail: user.email,
        tenantId: tenantId,
        shopId: shopId,
        role: user.role,
        iat: Math.floor(Date.now() / 1000), // Issued at
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // if token created token then update the token
    if (token) {
      await db.query(
        `UPDATE users SET token = ? WHERE id = ? AND email = ?   LIMIT 1`,
        [token, user.id, user.email]
      );
    }
    // Set secure cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        tenantId: tenantId,
        shopId: shopId,
        tenant_name: tenant?.name,
        shop_name: selectedShop.name,
      },
      token,
      selectedShop: selectedShop,
      step: "login_complete",
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function me(req, res) {
  try {
    const userReq = req.user;
    const { userId, tenantId, shopId, userEmail, role } = userReq;

    // Fetch user info from DB with tenant and shop details
    const [users] = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.role
       FROM users u
       WHERE u.id = ? AND u.email = ?
       LIMIT 1`,
      [userId, userEmail]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Prepare response object
    const responseData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      role: user.role,
    };

    // Get tenant info if tenantId exists
    if (tenantId) {
      const [tenants] = await db.query(
        `SELECT name, domain FROM tenants WHERE id = ?`,
        [tenantId]
      );

      if (tenants && tenants.length > 0) {
        responseData.tenantId = tenantId;
        responseData.tenant_name = tenants[0].name;
        responseData.tenant_domain = tenants[0].domain;
      }
    }

    // Get shop info if shopId exists
    if (shopId) {
      const [shops] = await db.query(
        `SELECT name, address, phone FROM shops WHERE id = ?`,
        [shopId]
      );

      if (shops && shops.length > 0) {
        responseData.shopId = shopId;
        responseData.shop_name = shops[0].name;
        responseData.shop_address = shops[0].address;
        responseData.shop_phone = shops[0].phone;
      }
    }

    return res.status(200).json({
      user: responseData,
    });
  } catch (err) {
    console.error("me() error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export const logout = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    const userId = req.user?.userId;

    if (token && userId) {
      // Clear token from database for specific user
      await db.query(
        `UPDATE users SET token = NULL WHERE id = ? AND token = ? LIMIT 1`,
        [userId, token]
      );
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
