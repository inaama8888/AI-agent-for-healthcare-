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

const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = pool;

