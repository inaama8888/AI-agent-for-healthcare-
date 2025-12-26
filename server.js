// // const express = require("express");
// // require("dotenv").config();
// // console.log("🔑 OpenAI KEY loaded:", !!process.env.OPENAI_API_KEY);

// // const cors = require("cors");

// // const app = express();

// // app.use(express.json());
// // app.use(cors());
// // app.use(express.static("Public"));

// // // 🔗 חיבור למסד נתונים (פעם אחת)
// // require("./db");

// // // ======================================================
// // // בדיקת משתמש קיים
// // // ======================================================
// // app.post("/api/check-user", (req, res) => {
// //   const db = require("./db");
// //   const { name } = req.body;

// //   const sql = "SELECT * FROM Users WHERE full_name = ? LIMIT 1";
// //   db.query(sql, [name], (err, result) => {
// //     if (err) return res.json({ error: err });
// //     res.json({ exists: result.length > 0, user: result[0] });
// //   });
// // });

// // // ======================================================
// // // שליפת שיעורים
// // // ======================================================
// // app.get("/api/lessons", (req, res) => {
// //   const db = require("./db");

// //   const sql = `
// //     SELECT lesson_id, topic AS title, instructor, date, seats, city
// //     FROM Lessons
// //   `;

// //   db.query(sql, (err, result) => {
// //     if (err) return res.status(500).json({ error: err });
// //     res.json({ lessons: result });
// //   });
// // });

// // // ======================================================
// // // ROUTES
// // // ======================================================
// // const faqRoute = require("./routes/faqRoute");
// // app.use("/api/faq", faqRoute);

// // const emotionalSupportRoute = require("./routes/emotionalSupportRoute");
// // app.use("/api/emotional-support", emotionalSupportRoute);

// // // ======================================================
// // const PORT = 5000;
// // app.listen(PORT, () =>
// //   console.log(`🚀 Server running on http://localhost:${PORT}`)
// // );



// // שרת
// const express = require("express");
// require("dotenv").config();
// const cors = require("cors");

// const db = require("./db"); // 👈 פעם אחת בלבד

// const app = express();

// app.use(express.json());
// app.use(cors());
// app.use(express.static("Public"));

// // ======================================================
// // בדיקת משתמש קיים
// // ======================================================
// app.post("/api/check-user", (req, res) => {
//   const { name } = req.body;

//   const sql = "SELECT * FROM users WHERE full_name = ? LIMIT 1";
//   db.query(sql, [name], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ exists: result.length > 0, user: result[0] });
//   });
// });

// // ======================================================
// // שליפת שיעורים
// // ======================================================
// app.get("/api/lessons", (req, res) => {
//   const sql = `
//     SELECT lesson_id, topic AS title, instructor, date, seats, city
//     FROM lessons
//   `;

//   db.query(sql, (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ lessons: result });
//   });
// });

// // ======================================================
// // ROUTES
// // ======================================================
// app.use("/api/faq", require("./routes/faqRoute"));
// app.use("/api/emotional-support", require("./routes/emotionalSupportRoute"));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`🚀 Server running on port ${PORT}`)
// );

const express = require("express");
require("dotenv").config();
const cors = require("cors");

const db = require("./db"); // חיבור DB פעם אחת

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("Public"));

/* ================================
   HEALTH CHECK (חשוב ל-Railway)
================================ */
app.get("/", (req, res) => {
  res.status(200).send("✅ Server is running");
});

/* ================================
   בדיקת משתמש קיים
================================ */
app.post("/api/check-user", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const sql = "SELECT * FROM users WHERE full_name = ? LIMIT 1";

  db.query(sql, [name], (err, result) => {
    if (err) {
      console.error("❌ DB ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      exists: result.length > 0,
      user: result[0] || null,
    });
  });
});

/* ================================
   שליפת שיעורים
================================ */
app.get("/api/lessons", (req, res) => {
  const sql = `
    SELECT lesson_id, topic AS title, instructor, date, seats, city
    FROM lessons
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ DB ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ lessons: result });
  });
});

/* ================================
   ROUTES נוספים
================================ */
app.use("/api/faq", require("./routes/faqRoute"));
app.use("/api/emotional-support", require("./routes/emotionalSupportRoute"));

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
