const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const db = require("../db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== טקסט קבוע: עמותה + מנחים =====
const contextText = fs.readFileSync(
  path.join(__dirname, "faq_context.txt"),
  "utf8"
);

router.post("/", async (req, res) => {
  const { type, question } = req.body;

  // 🔥 לוג ראשי – חובה
  console.log("====================================");
  console.log("📥 FAQ ROUTE HIT");
  console.log("👉 BODY:", req.body);
  console.log("👉 TYPE:", type);
  console.log("👉 QUESTION:", question);
  console.log("====================================");

  if (!type || !question) {
    console.log("❌ Missing type or question");
    return res.json({ answer: "חסרים נתונים בשאלה." });
  }

  // =========================
  // 1️⃣ שאלות על שיעורים
  // =========================
  if (type === "LESSONS") {
    console.log("📘 ENTERED LESSONS FLOW");

    db.query("SELECT * FROM Lessons", async (err, lessons) => {
      if (err) {
        console.error("❌ DB ERROR:", err);
        return res.json({ answer: "שגיאה בשליפת שיעורים." });
      }

      console.log("📘 Lessons count:", lessons.length);

      const lessonsText = lessons.map(l => `
מספר שיעור: ${l.lesson_id}
נושא: ${l.topic}
עיר: ${l.city || "לא צוין"}
תאריך: ${l.date}
תיאור: ${l.description || "אין תיאור"}
`).join("\n");

      const prompt = `
ענה אך ורק על סמך המידע הבא.
אם אין תשובה – אמור: "לא נמצא מידע על כך."

${lessonsText}

שאלה:
"${question}"
`;

      console.log("📘 PROMPT SENT TO OPENAI (LESSONS)");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      console.log("✅ OpenAI response received (LESSONS)");

      return res.json({ answer: completion.choices[0].message.content });
    });

    return;
  }

  // =========================
  // 2️⃣ שאלות על העמותה / מנחים
  // =========================
  if (type === "ORG" || type === "INSTRUCTORS") {
    console.log("🌱 ENTERED ORG / INSTRUCTORS FLOW");

    const prompt = `
ענה אך ורק על סמך הטקסט הבא.
אסור להמציא מידע.
אם אין מידע – אמור: "אין לי מידע על כך."

${contextText}

שאלה:
"${question}"
`;

    console.log("🌱 PROMPT SENT TO OPENAI (ORG / INSTRUCTORS)");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    console.log("✅ OpenAI response received (ORG / INSTRUCTORS)");

    return res.json({ answer: completion.choices[0].message.content });
  }

  // =========================
  // fallback
  // =========================
  console.log("❌ FALLBACK – TYPE NOT SUPPORTED:", type);
  return res.json({ answer: "סוג שאלה לא נתמך." });
});

module.exports = router;
