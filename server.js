const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("Public"));

// חיבור ל-MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",      // ← לשנות אם בחרת סיסמה אחרת
  database: "ai_agent"
});

// בדיקה שהתחבר
db.connect(err => {
  if (err) {
    console.error("MySQL ERROR:", err);
    return;
  }
  console.log("✅ MySQL Connected!");
});

// ---------------- API ----------------
//// בדיקת התחברות
const handleName = async () => {
  const name = input.trim();
  if (!name) {
    sendBot("אנא הזן שם חוקי.");
    return;
  }

  try {
    const res = await axios.get(
      `http://localhost:5000/api/user?name=${encodeURIComponent(name)}`
    );

    if (res.data.exists) {
      // ✨ לקחת את השם האמיתי מהשרת — זה הקריטי!!!
      const realName = res.data.user.full_name;

      setUserName(realName);
      sendBot(`התחברת בהצלחה, ${realName}!`);
      setTimeout(() => showMenu(), 300);
      setStep("menu");
    } else {
      sendBot("השם לא נמצא במערכת. נסה להקליד שם אחר.");
    }
  } catch (err) {
    console.error(err);
    sendBot("שגיאה בשרת — נסה שנית מאוחר יותר.");
  }
};


// שליפת שיעורים
app.get("/api/lessons", (req, res) => {
  const sql = `
      SELECT 
        lesson_id,
        topic AS title,
        instructor,
        date,
        seats
      FROM Lessons
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ lessons: result });
  });
});

// הרשמה לשיעור
app.post("/api/register", (req, res) => {
  const { name, lesson_id } = req.body;

  if (!name || !lesson_id) {
    return res.json({ status: "ERROR", message: "Missing fields" });
  }

  // 1️⃣ מציאת user_id לפי השם
  const findUserSql = "SELECT user_id FROM Users WHERE full_name = ? LIMIT 1";

  db.query(findUserSql, [name], (err, userResult) => {
    if (err) return res.json({ status: "ERROR", error: err });
    if (userResult.length === 0)
      return res.json({ status: "ERROR", message: "User not found" });

    const user_id = userResult[0].user_id;

    // 2️⃣ בדיקת כמות רשומים וקיבולת
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

      // 3️⃣ בדיקה: מלא?
      if (registered >= max_seats) {
        return res.json({ status: "FULL", message: "השיעור מלא ❌" });
      }

      // 4️⃣ הוספה – יש מקום!
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


// יצירת משתמש (אופציונלי בכפתור "Start")
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

// הפעלת שרת
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
