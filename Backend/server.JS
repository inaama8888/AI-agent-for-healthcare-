const express = require('express');
const path = require('path');
const app = express();

// הגדרת תיקיית public כסטטית
// __dirname מצביע על תיקיית BACKEND
app.use(express.static(path.join(__dirname, 'public')));

// ראוט בסיסי – מחזיר את index.html מתוך תיקיית public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// הפעלת השרת
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ השרת רץ בכתובת: http://localhost:${PORT}`);
});
