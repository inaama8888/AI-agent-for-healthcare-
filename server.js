

const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const db = require("./db"); // חיבור DB פעם אחת
const crypto = require("crypto");

const app = express();

const { sendApprovalEmail } = require("./routes/mailer");


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
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone is required" });
  }

  try {
    // 1️⃣ בדיקה אם משתמש מאושר קיים
    const [users] = await db.query(
      "SELECT full_name FROM users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (users.length > 0) {
      return res.json({
        status: "APPROVED",
        user: users[0],
      });
    }

    // 2️⃣ בדיקה אם קיימת בקשה בהמתנה
    const [pending] = await db.query(
      "SELECT request_id FROM pending_users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (pending.length > 0) {
      return res.json({
        status: "PENDING",
      });
    }

    // 3️⃣ משתמש חדש
    return res.json({
      status: "NEW",
    });
  } catch (err) {
    console.error("check-user error:", err);
    return res.status(500).json({ error: "Database error" });
  }
});



app.post("/api/create-user", async (req, res) => {
  const { phone, full_name } = req.body;

  if (!phone || !full_name) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO users (phone, full_name) VALUES (?, ?)",
      [phone, full_name]
    );

    res.json({ user_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "User already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});


/* ================================
   יצירת בקשת הרשמה (pending)
================================ */
app.post("/api/pending-users", async (req, res) => {
  const { full_name, phone, reason } = req.body;
  const approvalToken = crypto.randomBytes(32).toString("hex");


  if (!full_name || !phone) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    
    // 1️⃣ שמירה בטבלת pending_users
    await db.query(
      "INSERT INTO pending_users (full_name, phone, reason, approval_token) VALUES (?, ?, ?, ?)",
      [full_name, phone, reason || null, approvalToken]
    );

    // 2️⃣ שליחת מייל למנהלת
    await sendApprovalEmail({ full_name, phone, reason ,approvalToken});

    // 3️⃣ תשובה ל־frontend / בוט
    res.json({ status: "PENDING_CREATED" });
  } catch (err) {
    console.error("❌ pending-users error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Request already exists" });
    }

    res.status(500).json({ error: "Failed to create pending user" });
  }
});



  ///vranv
  /* ================================
   הרשמה לשיעור  ✅ (שלב 1)
================================ */
app.post("/api/register", async (req, res) => {
  const { phone, lesson_id } = req.body;

  if (!phone || !lesson_id) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const [users] = await db.query(
      "SELECT user_id FROM users WHERE phone = ? LIMIT 1",
      [phone]
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



app.get("/api/approve", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token missing");
  }

  try {
    // 1️⃣ שליפת בקשה ממתינה
    const [rows] = await db.query(
      "SELECT full_name, phone FROM pending_users WHERE approval_token = ? AND status = 'pending' LIMIT 1",
      [token]
    );

    if (!rows.length) {
      return res.send("הקישור אינו תקף או שכבר טופל");
    }

    const { full_name, phone } = rows[0];

    // 2️⃣ הכנסת המשתמש לטבלת users
    await db.query(
      "INSERT INTO users (full_name, phone) VALUES (?, ?)",
      [full_name, phone]
    );

    // 3️⃣ עדכון הבקשה ל־approved
    await db.query(
      "UPDATE pending_users SET status = 'approved', approval_token = NULL WHERE phone = ?",
      [phone]
    );

    res.send("✔️ הבקשה אושרה! המשתמש נוסף למערכת.");
  } catch (err) {
    console.error("❌ approve error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.send("המשתמש כבר קיים במערכת");
    }

    res.status(500).send("שגיאה באישור הבקשה");
  }
});

app.get("/api/reject", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token missing");
  }

  const [rows] = await db.query(
    "SELECT * FROM pending_users WHERE approval_token = ? AND status = 'pending'",
    [token]
  );

  if (!rows.length) {
    return res.send("הקישור אינו תקף או שכבר טופל");
  }

  await db.query(
    "UPDATE pending_users SET status = 'rejected', approval_token = NULL WHERE approval_token = ?",
    [token]
  );

  res.send("❌ הבקשה נדחתה");
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



app.use("/api/lessons", require("./routes/nearbyLessonsRoute"));


