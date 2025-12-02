import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("greet");
  const [userName, setUserName] = useState("");
  const [lessons, setLessons] = useState([]);

  const sendBot = (text) => {
    setMessages((prev) => [...prev, { sender: "bot", text }]);
  };

  const sendUser = (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  };

  const formatDateTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return d.toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
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

  useEffect(() => {
    sendBot("שלום וברכה! מה שמך?");
  }, []);

  const handleName = async () => {
    const name = input.trim();
    if (!name) {
      sendBot("נא להזין שם.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/check-user", {
        name,
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

  const showMainMenu = () => {
    sendBot("בחרי פעולה:");
    sendBot(
      ["1 - הרשמה לשיעור", "2 - שאלות ותשובות על שיעורים", "3 - תמיכה רגשית"].join("\n")
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
          "0 - חזרה",
          "9 - תפריט ראשי",
        ].join("\n")
      );
      setStep("choose_search_method");
    } else if (input === "2") {
      sendBot("מוזמנת לשאול כל שאלה על שיעורים.");
    } else if (input === "3") {
      sendBot("אני כאן איתך ❤️ מה את מרגישה עכשיו?");
      setStep("emotional_feeling");
    } else {
      sendBot("בחירה לא תקינה.");
    }
  };

  const handleEmotionalFeeling = async () => {
    const feeling = input.trim();
    if (!feeling) {
      sendBot("נא לכתוב מה את מרגישה ❤️");
      return;
    }

    sendBot("יוצרת עבורך תרגול נשימה והתבוננות...");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/emotional-support",
        {
          feeling,
          userName,
        }
      );

      const exercise = res.data.mindfulness_exercise;

      sendBot(`🧘‍♀️ *${exercise.title}*`);
      exercise.steps.forEach((s, i) => {
        sendBot(`שלב ${i + 1}: ${s}`);
      });

      sendBot("רוצה תרגול נוסף? כתבי שוב רגש ❤️");
    } catch {
      sendBot("שגיאה בקבלת תרגול רגשתי.");
    }
  };

  const handleSearchMenu = () => {
    if (input === "1") {
      loadAllLessons();
    } else if (input === "2") {
      sendBot("הקלידי שם עיר (או 'זום'):");
      setStep("search_city");
    } else if (input === "3") {
      sendBot("הקלידי נושא שיעור:");
      setStep("search_topic");
    } else if (input === "0" || input === "9") {
      showMainMenu();
      setStep("main_menu");
    } else {
      sendBot("בחירה לא תקינה.");
    }
  };

  const loadAllLessons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lessons");

      if (!res.data.lessons.length) {
        sendBot("לא נמצאו שיעורים.");
        return;
      }

      setLessons(res.data.lessons);

      sendBot("רשימת השיעורים:");
      res.data.lessons.forEach((l, i) => sendBot(formatLessonDetails(l, i)));

      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בטעינת שיעורים.");
    }
  };

  const searchByCity = async () => {
    const city = input.trim();
    if (!city) {
      sendBot("נא להזין עיר.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lessons/by-city?city=${encodeURIComponent(
          city
        )}`
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

      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בחיפוש לפי עיר.");
    }
  };

  const searchByTopic = async () => {
    const topic = input.trim();
    if (!topic) {
      sendBot("נא להזין נושא.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lessons/by-topic?topic=${encodeURIComponent(
          topic
        )}`
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

      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בחיפוש לפי נושא.");
    }
  };

  const handleRegister = async () => {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= lessons.length) {
      sendBot("מספר לא תקין.");
      return;
    }

    const lesson = lessons[index];

    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        name: userName,
        lesson_id: lesson.lesson_id,
      });

      if (res.data.status === "FULL") {
        sendBot("השיעור מלא.");
        return;
      }

      sendBot(`נרשמת לשיעור: ${lesson.title}`);

      sendBot(["1 - חזרה לתפריט", "2 - חיפוש נוסף"].join("\n"));
      setStep("after_register_menu");
    } catch {
      sendBot("שגיאה בהרשמה.");
    }
  };

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
          "0 - חזרה",
          "9 - תפריט ראשי",
        ].join("\n")
      );
      setStep("choose_search_method");
    } else {
      sendBot("נא לבחור 1 או 2.");
    }
  };

  const handlers = {
    greet: handleName,
    main_menu: handleMainMenu,
    choose_search_method: handleSearchMenu,
    search_city: searchByCity,
    search_topic: searchByTopic,
    register: handleRegister,
    after_register_menu: handleAfterRegisterMenu,
    emotional_feeling: handleEmotionalFeeling,
  };

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
