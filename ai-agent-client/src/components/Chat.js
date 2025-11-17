import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("greet");
  const [userName, setUserName] = useState("");
  const [lessons, setLessons] = useState([]);

  const sendBot = (text) =>
    setMessages((prev) => [...prev, { sender: "bot", text }]);

  const sendUser = (text) =>
    setMessages((prev) => [...prev, { sender: "user", text }]);

  // הודעת פתיחה
  useEffect(() => {
    sendBot("שלום וברוך הבא! מה השם שלך?");
  }, []);

  // ------------------------------
  // 1️⃣ בדיקת שם משתמש
  // ------------------------------
 const handleName = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/check-user", {
      name: input
    });

    if (!res.data.exists) {
      sendBot("השם לא קיים במערכת ❌");
      sendBot("אנא הזן שם אחר:");
      return;       // ❗ עצירה — לא ממשיכים לתפריט
    }

    // אם קיים
    sendBot(`התחברת בהצלחה, ${input}! 😊`);
    setUserName(input);
    setStep("menu");
    setTimeout(() => showMenu(), 300);

  } catch (err) {
    console.error(err);
    sendBot("שגיאה בשרת — נסה שוב מאוחר יותר ❌");
  }
};


  // ------------------------------
  // 2️⃣ תפריט ראשי
  // ------------------------------
  const showMenu = () => {
    sendBot("בחר פעולה:");
    sendBot("1️⃣ הרשמה לשיעור");
    sendBot("2️⃣ שאלות");
    sendBot("3️⃣ תמיכה רגשית");
  };

  const handleMenu = () => {
    if (input === "1") {
      sendBot("טוען שיעורים...");
      loadLessons();
    } else {
      sendBot("אנא בחר מספר תקין 🙏");
    }
  };

  // ------------------------------
  // 3️⃣ שליפת שיעורים
  // ------------------------------
  const loadLessons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lessons");
      setLessons(res.data.lessons);

      sendBot("הנה רשימת השיעורים:");
      res.data.lessons.forEach((l, i) =>
        sendBot(`${i + 1}. ${l.title} — ${l.instructor}`)
      );

      sendBot("הקלד מספר שיעור:");
      setStep("register");

    } catch {
      sendBot("שגיאה בקריאת השיעורים ❌");
    }
  };

  // ------------------------------
  // 4️⃣ הרשמה לשיעור
  // ------------------------------
const handleRegister = async () => {
  const index = parseInt(input) - 1;

  if (index < 0 || index >= lessons.length) {
    sendBot("מספר לא תקין, נסה שוב.");
    return;
  }

  const lesson = lessons[index];

  try {
    const res = await axios.post("http://localhost:5000/api/register", {
      name: userName,
      lesson_id: lesson.lesson_id
    });

    if (res.data.status === "FULL") {
      sendBot("מצטערים 😢 השיעור כבר מלא.");
      return;
    }

    sendBot(`נרשמת בהצלחה ל"${lesson.title}"! 🎉`);
    setStep("menu");
    setTimeout(() => showMenu(), 300);

  } catch {
    sendBot("שגיאה בהרשמה ❌");
  }
};

  // ------------------------------
  // 5️⃣ מפה של שלבים
  // ------------------------------
  const handlers = {
    greet: handleName,
    menu: handleMenu,
    register: handleRegister
  };

  const handleSend = () => {
    if (!input.trim()) return;

    sendUser(input);
    handlers[step]?.();
    setInput("");
  };

  return (
    <>
      <div className="header">סוכן AI לבריאות 🌿🤖</div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={m.sender}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="input-box">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="הקלד הודעה..."
          />
          <button onClick={handleSend}>שליחה</button>
        </div>
      </div>

      <div className="footer">© 2025 צוות הפרויקט</div>
    </>
  );
}

export default Chat;
