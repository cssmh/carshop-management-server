import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

// remote pool
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, //10s
  enableKeepAlive: true,
  keepAliveInitialDelay: 20000, //20s
};

const db = mysql.createPool(dbConfig);

async function testConnection() {
  let conn;
  try {
    conn = await db.getConnection();
    console.log("\x1b[1;32m%s\x1b[0m", "✅ MySQL Connected Successfully!");
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    setTimeout(testConnection, 5000);
  } finally {
    if (conn) conn.release();
  }
}

testConnection();

export default db;
