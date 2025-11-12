const express = require('express');
const path = require('path');
const app = express();

// מגדיר את התיקייה Public כסטטית – כל קובץ בה יונגש למשתמש
app.use(express.static(path.join(__dirname, 'Public')));

// ראוט בסיסי – דף הבית (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// דוגמה לנתיב API – תוכלי להרחיב אותו בעתיד
app.post('/api/ask', express.json(), (req, res) => {
  const question = req.body.question || "אין שאלה";
  res.json({ answer: `השאלה שלך הייתה: ${question}` });
});

// PORT דינמי כדי ש-Railway יוכל להקצות פורט מתאים
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ השרת רץ בהצלחה על פורט ${PORT}`);
});
