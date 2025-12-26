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
  ///vranv
  /* ================================
   הרשמה לשיעור  ✅ (שלב 1)
================================ */
app.post("/api/register", (req, res) => {
  const { name, lesson_id } = req.body;

  if (!name || !lesson_id) {
    return res.status(400).json({ error: "Missing data" });
  }

  // ⚠️ זה השם שהיה לך בישן – אם שונה, תגידי
  const sql = `
    INSERT INTO user_lessons (user_name, lesson_id)
    VALUES (?, ?)
  `;

  db.query(sql, [name, lesson_id], (err) => {
    if (err) {
      console.error("❌ REGISTRATION ERROR:", err);

      // טיפול במקרה של הרשמה כפולה / מלא
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({ status: "FULL" });
      }

      return res.status(500).json({ error: "Registration failed" });
    }

    res.json({ status: "OK" });
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
const path = require("path");

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
