const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { feeling, userName } = req.body;

    if (!feeling) {
      return res.status(400).json({ error: "Feeling is required" });
    }

    const systemPrompt = `
אתה מנחה מיינדפולנס לחולי סרטן.
אתה מחזיר אך ורק JSON תקף שמתאים לפורמט שצוין - ללא טקסט נוסף.
אין כותרות, אין הסברים, אין קוד, אין עטיפות טקסט.
הפורמט *חובה* להיות בדיוק כך:

{
  "mindfulness_exercise": {
    "title": "string",
    "steps": [
      "string",
      "string",
      "string",
      "string",
      "string"
    ]
  }
}

אם אינך בטוח - החזר מבנה ריק תקין.
    `;

    const userPrompt = `
המשתמש "${userName || "לא ידוע"}" מרגיש "${feeling}".
צור עבורו תרגול מיינדפולנס מותאם בפורמט JSON בלבד.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },

      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" } 
    });

    let raw = completion.choices[0].message.content.trim();

   

    console.log("📥 CLEAN RAW:", raw);

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.log("❌ JSON parse failed:", err.message);

      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: raw,
        fallback: {
          mindfulness_exercise: {
            title: "תרגול מיינדפולנס כללי",
            steps: [
              "שבו או שכבו במקום נוח ושקט.",
              "קחו נשימה עמוקה ואיטית דרך האף והוציאו דרך הפה.",
              "שימו לב לתחושות הגוף שלכם, ללא שיפוט.",
              "הכירו ברגש שאתם חשים כעת, ותנו לו מקום.",
              "חזרו לנשימה ופתחו בעדינות את העיניים."
            ]
          }
        }
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err.message);
    return res.status(500).json({
      error: "Server error or OpenAI API error",
      details: err.message,
    });
  }
});

module.exports = router;