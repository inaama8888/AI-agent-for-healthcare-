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
//app.use(express.static("Public"));

/* ================================
   HEALTH CHECK (חשוב ל-Railway)
================================ */

/* ================================
   בדיקת משתמש קיים
================================ */
app.post("/api/check-user", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE full_name = ? LIMIT 1",
      [name]
    );

    res.json({
      exists: rows.length > 0,
      user: rows[0] || null,
    });
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});
  ///vranv
  /* ================================
   הרשמה לשיעור  ✅ (שלב 1)
================================ */
app.post("/api/register", async (req, res) => {
  const { name, lesson_id } = req.body;

  if (!name || !lesson_id) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const [users] = await db.query(
      "SELECT user_id FROM users WHERE full_name = ? LIMIT 1",
      [name]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user_id = users[0].user_id;

    await db.query(
      "INSERT INTO user_lessons (user_id, lesson_id) VALUES (?, ?)",
      [user_id, lesson_id]
    );

    res.json({ status: "OK" });
  } catch (err) {
    console.error("❌ REGISTRATION ERROR:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.json({ status: "FULL" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

/* ================================
   שליפת שיעורים
================================ */
app.get("/api/lessons", async (req, res) => {
  const { city, topic, instructor, level } = req.query;

  console.log("📍 QUERY:", { city, topic, instructor, level });

  try {
    let query = `
      SELECT lesson_id, topic AS title, instructor, level, date, seats, city
      FROM lessons
      WHERE 1=1
    `;
    const params = [];

    // עיר – התאמה מלאה
    if (city) {
      query += " AND city = ?";
      params.push(city);
    }

    // נושא – התאמה חלקית
    if (topic) {
      query += " AND topic LIKE ?";
      params.push(`%${topic}%`);
    }

    // מנחה – התאמה חלקית
    if (instructor) {
      query += " AND instructor LIKE ?";
      params.push(`%${instructor}%`);
    }

    // רמה – התאמה חלקית
    if (level) {
      query += " AND level LIKE ?";
      params.push(`%${level}%`);
    }

    const [rows] = await db.query(query, params);
    res.json({ lessons: rows });
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});



/* ================================
   ROUTES נוספים
================================ */
app.use("/api/faq", require("./routes/faqRoute"));
app.use("/api/emotional-support", require("./routes/emotionalSupportRoute"));
const path = require("path");
// only prod

app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "client", "build", "index.html")
  );
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
