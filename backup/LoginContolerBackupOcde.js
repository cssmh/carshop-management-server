// export const login = async (req, res) => {
//   const { tenantIdentifier, email, password } = req.body;

//   // tenantIdentifier can be tenant domain/slug or tenant id
//   if (!tenantIdentifier || !email || !password)
//     return res.status(400).json({ message: "Missing fields" });
//   const conn = await db.getConnection();
//   try {
//     // find tenant
//     const [tenants] = await conn.query(
//       `SELECT id FROM tenants WHERE domain = ? OR id = ? LIMIT 1`,
//       [tenantIdentifier, tenantIdentifier]
//     );

//     if (!tenants || tenants.length === 0)
//       return res.status(400).json({ message: "Tenant not found" });

//     const tenant = tenants[0];

//     // find user under that tenant
//     const [users] = await conn.query(
//       `SELECT id, tenant_id, role, password_hash, first_name, last_name, is_active FROM users WHERE email = ? AND tenant_id = ? LIMIT 1`,
//       [email, tenant.id]
//     );

//     if (!users || users.length === 0)
//       return res.status(400).json({ message: "User not found" });
//     const user = users[0];

//     if (!user.is_active)
//       return res.status(403).json({ message: "User disabled" });

//     const isPasswordCorrect = await bcrypt.compare(
//       password,
//       user.password_hash
//     );
//     if (!isPasswordCorrect)
//       return res.status(401).json({ message: "Invalid credentials" });

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user.id, tenantId: user.tenant_id, role: user.role },
//       process.env.ACCESS_TOKEN_SECRET,
//       { expiresIn: "1d" }
//     );

//     // if token created token then update the token
//     if (token) {
//       await db.query(
//         `UPDATE users SET token = ? WHERE email = ? AND id = ? AND tenant_id = ?  LIMIT 1`,
//         [token, email, user.id, tenant.id]
//       );
//     }

//     // Set the token as a cookie
//     res.cookie("auth_token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     });

//     res.status(200).json({
//       user: {
//         id: user.id,
//         first_name: user.first_name,
//         last_name: user.last_name,
//         role: user.role,
//         tenantId: user.tenant_id,
//       },
//       token: token,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   } finally {
//     conn.release();
//   }
// };

export const login = async (req, res) => {
  const { email, password, tenantIdentifier } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  const conn = await db.getConnection();
  try {
    // Step 1: Find all user records with this email across all tenants
    const [users] = await conn.query(
      `SELECT id, tenant_id, role, password_hash, first_name, last_name, is_active FROM users WHERE email = ?`,
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check password against the first user found (assuming credentials are consistent across tenants for a single user)
    const isPasswordCorrect = await bcrypt.compare(
      password,
      users[0].password_hash
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!tenantIdentifier) {
      // This is the initial login request without a company selection
      const allTenants = await conn.query(
        `SELECT id, name, domain FROM tenants WHERE id IN (?)`,
        [users.map((u) => u.tenant_id)]
      );

      if (allTenants[0].length > 1) {
        // Horizontal Multi-Company: Return list of companies to the client
        return res.status(200).json({ companies: allTenants[0] });
      } else {
        // Single Company or Vertical: Log in automatically
        const user = users[0];
        const token = jwt.sign(
          { userId: user.id, tenantId: user.tenant_id, role: user.role },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        await conn.query(`UPDATE users SET token = ? WHERE id = ?`, [
          token,
          user.id,
        ]);

        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            tenantId: user.tenant_id,
          },
          token: token,
        });
      }
    } else {
      // This is the second login request after a user selects a company
      const selectedUser = users.find((u) => u.tenant_id === tenantIdentifier);
      if (!selectedUser) {
        return res
          .status(401)
          .json({ message: "Invalid credentials for this company" });
      }

      const token = jwt.sign(
        {
          userId: selectedUser.id,
          tenantId: selectedUser.tenant_id,
          role: selectedUser.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      await conn.query(`UPDATE users SET token = ? WHERE id = ?`, [
        token,
        selectedUser.id,
      ]);

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        user: {
          id: selectedUser.id,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          role: selectedUser.role,
          tenantId: selectedUser.tenant_id,
        },
        token: token,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};
