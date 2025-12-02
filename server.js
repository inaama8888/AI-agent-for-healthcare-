
const express = require("express");
require("dotenv").config();
console.log("🔑 OpenAI KEY loaded:", !!process.env.OPENAI_API_KEY);

const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("Public"));

// ---------------------------
// חיבור למסד נתונים
// ---------------------------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "ai_agent"
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL ERROR:", err);
    return;
  }
  console.log("✅ MySQL Connected!");
});

// ---------------------------
// 1. בדיקת משתמש קיים
// ---------------------------
app.post("/api/check-user", (req, res) => {
  const { name } = req.body;
  const sql = "SELECT * FROM Users WHERE full_name = ? LIMIT 1";

  db.query(sql, [name], (err, result) => {
    if (err) return res.json({ error: err });

    if (result.length > 0) {
      return res.json({ exists: true, user: result[0] });
    }

    res.json({ exists: false });
  });
});

// ---------------------------
// 2. שליפת כל השיעורים
// ---------------------------
app.get("/api/lessons", (req, res) => {
  const sql = `
    SELECT 
      lesson_id,
      topic AS title,
      instructor,
      date,
      seats,
      city,
      location
    FROM Lessons
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ lessons: result });
  });
});

// ---------------------------
// 3. חיפוש שיעורים לפי עיר
// ---------------------------
app.get("/api/lessons/by-city", (req, res) => {
  const { city } = req.query;
  if (!city) return res.json({ lessons: [] });

  const sql = `
    SELECT
      lesson_id,
      topic AS title,
      instructor,
      date,
      seats,
      city,
      location
    FROM Lessons
    WHERE city LIKE ?
  `;

  db.query(sql, [`%${city}%`], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ lessons: result });
  });
});

// ---------------------------
// 4. חיפוש שיעורים לפי נושא
// ---------------------------
app.get("/api/lessons/by-topic", (req, res) => {
  const { topic } = req.query;
  if (!topic) return res.json({ lessons: [] });

  const sql = `
    SELECT
      lesson_id,
      topic AS title,
      instructor,
      date,
      seats,
      city,
      location
    FROM Lessons
    WHERE topic LIKE ?
  `;

  db.query(sql, [`%${topic}%`], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ lessons: result });
  });
});

// ---------------------------
// 5. חיפוש שיעורים לפי תאריך
//    מצפים לפורמט YYYY-MM-DD
// ---------------------------
app.get("/api/lessons/by-date", (req, res) => {
  const { date } = req.query; // למשל 2025-05-15
  if (!date) return res.json({ lessons: [] });

  const sql = `
    SELECT
      lesson_id,
      topic AS title,
      instructor,
      date,
      seats,
      city,
      location
    FROM Lessons
    WHERE DATE(date) = ?
  `;

  db.query(sql, [date], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ lessons: result });
  });
});

// ---------------------------
// 6. הרשמה לשיעור עם בדיקת קיבולת
// ---------------------------
app.post("/api/register", (req, res) => {
  const { name, lesson_id } = req.body;

  if (!name || !lesson_id) {
    return res.json({ status: "ERROR", message: "Missing fields" });
  }

  const findUserSql = "SELECT user_id FROM Users WHERE full_name = ? LIMIT 1";

  db.query(findUserSql, [name], (err, userResult) => {
    if (err) return res.json({ status: "ERROR", error: err });
    if (userResult.length === 0)
      return res.json({ status: "ERROR", message: "User not found" });

    const user_id = userResult[0].user_id;

    const checkSql = `
      SELECT 
        L.seats AS max_seats,
        COUNT(UL.reg_id) AS registered
      FROM Lessons L
      LEFT JOIN User_Lessons UL ON L.lesson_id = UL.lesson_id
      WHERE L.lesson_id = ?
      GROUP BY L.lesson_id
    `;

    db.query(checkSql, [lesson_id], (err, countResult) => {
      if (err) return res.json({ status: "ERROR", error: err });
      if (countResult.length === 0)
        return res.json({ status: "ERROR", message: "Lesson not found" });

      const { max_seats, registered } = countResult[0];

      if (registered >= max_seats) {
        return res.json({ status: "FULL", message: "השיעור מלא" });
      }

      const insertSql = `
        INSERT INTO User_Lessons (user_id, lesson_id)
        VALUES (?, ?)
      `;

      db.query(insertSql, [user_id, lesson_id], (err, insertResult) => {
        if (err) return res.json({ status: "ERROR", error: err });

        res.json({ status: "OK", reg_id: insertResult.insertId });
      });
    });
  });
});

// ---------------------------
// 7. הוספת משתמש חדש (אם תרצי להשתמש בעתיד)
// ---------------------------
app.post("/api/user", (req, res) => {
  const { full_name } = req.body;

  db.query(
    "INSERT INTO Users (full_name) VALUES (?)",
    [full_name],
    (err, result) => {
      if (err) return res.json({ status: "ERROR", error: err });
      res.json({ status: "OK", user_id: result.insertId });
    }
  );
});

// ---------------------------
// הפעלת השרת
// ---------------------------

// ⬇️ כאן חיבור ה־API החדש
const emotionalSupportRoute = require("./routes/emotionalSupportRoute");
app.use("/api/emotional-support", emotionalSupportRoute);

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
