// כשמריצים על הלוקלי
//const mysql = require("mysql2");

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "1234",
//   database: "ai_agent",
// });

// db.connect(err => {
//   if (err) {
//     console.error("❌ MySQL ERROR:", err);
//   } else {
//     console.log("✅ MySQL Connected!");
//   }
// });

// /module.exports = db;
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 10000,
  timezone: "Z",
});

module.exports = pool;


