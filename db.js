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
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

console.log("✅ MySQL Pool ready");

module.exports = pool;
