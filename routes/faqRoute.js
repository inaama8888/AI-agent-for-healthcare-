
const express = require("express");

const router = express.Router();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const db = require("../db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const contextText = fs.readFileSync(
  path.join(__dirname, "faq_context.txt"),
  "utf8"
);

router.post("/", async (req, res) => {
  console.log("🔥 FAQ ROUTE CALLED");

  try {
    console.log("📦 RAW BODY:", req.body);

    const { type, question, lesson } = req.body;

   

    if (!type || !question) {
      console.log("❌ Missing type or question");
      return res.json({ answer: "חסרים נתונים בשאלה." });
    }

    if (type === "LESSONS") {
      console.log("📘 ENTERED LESSONS FLOW");

      let lessons = [];

      if (lesson?.lesson_id) {

        const result = await db.query(
          "SELECT * FROM lessons WHERE lesson_id = ?",
          [lesson.lesson_id]
        );


        lessons = result[0];
      } else {

        const result = await db.query("SELECT * FROM lessons");

        console.log("🗄 DB RESULT (all):", result);

        lessons = result[0];
      }

      console.log("📘 Lessons length:", lessons?.length);

      if (!lessons || lessons.length === 0) {
        console.log("⚠️ No lessons found");
        return res.json({
          answer: "לא נמצא מידע על השיעור המבוקש.",
        });
      }

const lessonsText = lessons.map(l => `
מספר שיעור: ${l.lesson_id}
נושא: ${l.topic || l.title}
מנחה: ${l.instructor || "לא צוין"}
רמה: ${l.level || "לא צוין"}
עיר: ${l.city || "לא צוין"}
תאריך: ${l.date}
תיאור: ${l.description || "אין תיאור"}
`).join("\n");
console.log("🧠 LESSONS TEXT SENT TO AI:\n", lessonsText);


    
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
אתה עוזר שעונה אך ורק על סמך המידע שסופק לך.
המידע היחיד שמותר לך להשתמש בו הוא פרטי השיעורים המופיעים למטה.
אסור לך להשתמש בידע כללי או חיצוני.
אם השאלה אינה קשורה ישירות למידע על השיעורים – עליך לענות:
"לא נמצא מידע על כך במסגרת השיעורים המופיעים במערכת."
אסור לך לנחש, להרחיב או להמציא מידע.
`
    },
    {
      role: "user",
      content: lessonsText + "\n\nשאלה:\n" + question
    }
  ],
  temperature: 0
});


      return res.json({
        answer: completion.choices[0].message.content,
      });
    }

  
    if (type === "ORG" || type === "INSTRUCTORS") {
      console.log("🌱 ENTERED ORG / INSTRUCTORS FLOW");

      const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
אתה עוזר שעונה אך ורק על סמך המידע שסופק לך.
המידע היחיד שמותר לך להשתמש בו הוא הטקסט שמופיע למטה.
אסור לך להשתמש בידע כללי, ידע קודם או הנחות.
אם השאלה אינה נענית במפורש מהטקסט – עליך להשיב:
"אין לי מידע על כך."
אין להמציא מנחים, שמות, פרטים ביוגרפיים או ניסיון אישי.
`
    },
    {
      role: "user",
      content: contextText + "\n\nשאלה:\n" + question
    }
  ],
  temperature: 0
});


      return res.json({
        answer: completion.choices[0].message.content,
      });
    }

    console.log("❌ TYPE NOT SUPPORTED:", type);
    return res.json({ answer: "סוג שאלה לא נתמך." });

  } catch (err) {
    console.error("🔥 FAQ ROUTE CRASHED:", err);
    return res.status(500).json({
      answer: "שגיאת שרת פנימית.",
    });
  }
});


module.exports = router;
