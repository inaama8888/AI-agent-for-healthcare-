import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("greet");
  const [userName, setUserName] = useState("");
  const [lessons, setLessons] = useState([]);

  // -------------------------
  // עזר להודעות
  // -------------------------
  const sendBot = (text) =>
    setMessages((prev) => [...prev, { sender: "bot", text }]);

  const sendUser = (text) =>
    setMessages((prev) => [...prev, { sender: "user", text }]);

  // -------------------------
  // עזר לפורמט תאריך
  // -------------------------
  const formatDateTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    // מציג יפה למשתמש: תאריך + שעה
    return d.toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };

  const formatLessonDetails = (lesson, index) => {
    return [
      `${index + 1}. ${lesson.title}`,
      `עיר: ${lesson.city || "ZOOM"}`,
      `מיקום: ${lesson.location || "-"}`,
      `תאריך ושעה: ${formatDateTime(lesson.date)}`,
      `מנחה: ${lesson.instructor || "-"}`,
      `מספר מקומות: ${lesson.seats ?? "-"}`,
    ].join("\n");
  };

  // -------------------------
  // פתיחה
  // -------------------------
  useEffect(() => {
    sendBot("שלום וברכה! מה שמך?");
  }, []);

  // -------------------------
  // 1. בדיקת שם
  // -------------------------
  const handleName = async () => {
    const name = input.trim();
    if (!name) {
      sendBot("נא להזין שם.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/check-user", {
        name
      });

      if (!res.data.exists) {
        sendBot("השם לא נמצא במערכת. אנא הזיני שם אחר:");
        return;
      }

      setUserName(name);
      sendBot(`נעים מאוד ${name}.`);

      setTimeout(showMainMenu, 300);
      setStep("main_menu");

    } catch {
      sendBot("שגיאה בשרת.");
    }
  };

  // -------------------------
  // 2. תפריט ראשי
  // -------------------------
  const showMainMenu = () => {
    sendBot("בחרי פעולה:");
    sendBot(
      [
        "1 - הרשמה לשיעור",
        "2 - שאלות ותשובות על שיעורים",
        "3 - תמיכה רגשית"
      ].join("\n")
    );
  };

  const handleMainMenu = () => {
    if (input === "1") {
      sendBot("כיצד תרצי לחפש שיעור?");
      sendBot(
        [
          "1 - כל השיעורים",
          "2 - לפי עיר",
          "3 - לפי נושא",
          "4 - לפי תאריך",
          "0 - חזרה",
          "9 - תפריט ראשי"
        ].join("\n")
      );
      setStep("choose_search_method");

    } else if (input === "2") {
      sendBot("מוזמנת לשאול כל שאלה על שיעורים.");

    } else if (input === "3") {
      sendBot("אני כאן. מה את מרגישה?");

    } else {
      sendBot("בחירה לא תקינה.");
    }
  };

  // -------------------------
  // 3. תת תפריט חיפוש
  // -------------------------
  const handleSearchMenu = () => {
    if (input === "1") {
      loadAllLessons();

    } else if (input === "2") {
      sendBot("הקלידי שם עיר (או 'זום'):");
      setStep("search_city");

    } else if (input === "3") {
      sendBot("הקלידי נושא שיעור (לדוגמה: איזון רגשי):");
      setStep("search_topic");

    } else if (input === "4") {
      sendBot("הקלידי תאריך בפורמט YYYY-MM-DD (לדוגמה: 2025-05-15):");
      setStep("search_date");

    } else if (input === "0" || input === "9") {
      showMainMenu();
      setStep("main_menu");

    } else {
      sendBot("בחירה לא תקינה.");
    }
  };

  // -------------------------
  // 4. כל השיעורים
  // -------------------------
  const loadAllLessons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lessons");

      if (!res.data.lessons.length) {
        sendBot("לא נמצאו שיעורים.");
        return;
      }

      setLessons(res.data.lessons);

      sendBot("רשימת השיעורים:");
      res.data.lessons.forEach((l, i) =>
        sendBot(formatLessonDetails(l, i))
      );

      sendBot("הקלידי מספר שיעור לבחירה:");
      setStep("register");

    } catch {
      sendBot("שגיאה בטעינת שיעורים.");
    }
  };

  // -------------------------
  // 5. חיפוש לפי עיר
  // -------------------------
  const searchByCity = async () => {
    const city = input.trim();
    if (!city) {
      sendBot("נא להזין עיר.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lessons/by-city?city=${encodeURIComponent(city)}`
      );
      const list = res.data.lessons;

      if (!list.length) {
        sendBot("לא נמצאו שיעורים בעיר זו.");
        setStep("choose_search_method");
        return;
      }

      setLessons(list);

      sendBot(`נמצאו ${list.length} שיעורים בעיר: ${city}`);
      list.forEach((l, i) => sendBot(formatLessonDetails(l, i)));

      sendBot("הקלידי מספר שיעור לבחירה:");
      setStep("register");

    } catch {
      sendBot("שגיאה בחיפוש לפי עיר.");
    }
  };

  // -------------------------
  // 6. חיפוש לפי נושא
  // -------------------------
  const searchByTopic = async () => {
    const topic = input.trim();
    if (!topic) {
      sendBot("נא להזין נושא.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lessons/by-topic?topic=${encodeURIComponent(topic)}`
      );
      const list = res.data.lessons;

      if (!list.length) {
        sendBot("לא נמצאו שיעורים בנושא זה.");
        setStep("choose_search_method");
        return;
      }

      setLessons(list);

      sendBot(`נמצאו ${list.length} שיעורים בנושא: ${topic}`);
      list.forEach((l, i) => sendBot(formatLessonDetails(l, i)));

      sendBot("הקלידי מספר שיעור לבחירה:");
      setStep("register");

    } catch {
      sendBot("שגיאה בחיפוש לפי נושא.");
    }
  };

  // -------------------------
  // 7. חיפוש לפי תאריך
  // -------------------------
  const searchByDate = async () => {
    const date = input.trim(); // מצופה YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sendBot("פורמט תאריך לא תקין. דוגמה: 2025-05-15");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lessons/by-date?date=${encodeURIComponent(date)}`
      );
      const list = res.data.lessons;

      if (!list.length) {
        sendBot("לא נמצאו שיעורים בתאריך זה.");
        setStep("choose_search_method");
        return;
      }

      setLessons(list);

      sendBot(`נמצאו ${list.length} שיעורים בתאריך: ${date}`);
      list.forEach((l, i) => sendBot(formatLessonDetails(l, i)));

      sendBot("הקלידי מספר שיעור לבחירה:");
      setStep("register");

    } catch {
      sendBot("שגיאה בחיפוש לפי תאריך.");
    }
  };

  // -------------------------
  // 8. הרשמה לשיעור
  // -------------------------
  const handleRegister = async () => {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= lessons.length) {
      sendBot("מספר שיעור לא תקין.");
      return;
    }

    const lesson = lessons[index];

    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        name: userName,
        lesson_id: lesson.lesson_id
      });

      if (res.data.status === "FULL") {
        sendBot("השיעור מלא.");
        return;
      }

      sendBot(`נרשמת לשיעור: ${lesson.title}`);

      sendBot(
        [
          "1 - חזרה לתפריט הראשי",
          "2 - חזרה לחיפוש שיעור"
        ].join("\n")
      );
      setStep("after_register_menu");

    } catch {
      sendBot("שגיאה בהרשמה.");
    }
  };

  // -------------------------
  // 9. תפריט אחרי הרשמה
  // -------------------------
  const handleAfterRegisterMenu = () => {
    if (input === "1") {
      showMainMenu();
      setStep("main_menu");

    } else if (input === "2") {
      sendBot("כיצד תרצי לחפש שיעור?");
      sendBot(
        [
          "1 - כל השיעורים",
          "2 - לפי עיר",
          "3 - לפי נושא",
          "4 - לפי תאריך",
          "0 - חזרה",
          "9 - תפריט ראשי"
        ].join("\n")
      );
      setStep("choose_search_method");

    } else {
      sendBot("נא לבחור 1 או 2.");
    }
  };

  // -------------------------
  // מיפוי שלבים
  // -------------------------
  const handlers = {
    greet: handleName,
    main_menu: handleMainMenu,
    choose_search_method: handleSearchMenu,
    search_city: searchByCity,
    search_topic: searchByTopic,
    search_date: searchByDate,
    register: handleRegister,
    after_register_menu: handleAfterRegisterMenu
  };

  // -------------------------
  // שליחת הודעה
  // -------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    sendUser(input);
    handlers[step]?.();
    setInput("");
  };

  return (
    <>
      <div className="header">סוכן AI לבריאות</div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.sender}
              dangerouslySetInnerHTML={{ __html: m.text }}
            ></div>
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
