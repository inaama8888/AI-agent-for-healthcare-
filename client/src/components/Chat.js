import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import "../styles/Chat.css";
import { ChatContext } from "../contexts/ChatContext";
import { API_BASE } from "../config";


function Chat() {
const normalizeChoice = (raw) => {
  const t = (raw || "").toLowerCase();

  if (t.includes("1") || t.includes("הרשמה")) return "1";
  if (t.includes("2") || t.includes("שאלות")) return "2";
  if (t.includes("3") || t.includes("תמיכה") || t.includes("רגש")) return "3";

  return raw.trim();
};

  
  const {
    mainMessages,
    setMainMessages,
    mainInput,
    setMainInput,
    step,
    setStep,
    userName,
    setUserName,
    lessons,
    setLessons,
  } = useContext(ChatContext);

  /* ========= FAQ STATE ========= */
  const [faqMode, setFaqMode] = useState("choose");
  const [faqType, setFaqType] = useState(null);
  const [faqSelectedLesson, setFaqSelectedLesson] = useState(null);

  /* ========= HELPERS ========= */
  const sendBot = (text) =>
    setMainMessages((prev) => [...prev, { sender: "bot", text }]);

  const sendUser = (text) =>
    setMainMessages((prev) => [...prev, { sender: "user", text }]);

  const formatDate = (d) =>
    new Date(d).toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    });

  const formatLesson = (l, i) =>
    [
      `${i + 1}. ${l.title}`,
      `עיר: ${l.city || "ZOOM"}`,
      `תאריך: ${formatDate(l.date)}`,
      `מנחה: ${l.instructor || "-"}`,
      `מקומות: ${l.seats ?? "-"}`,
    ].join("\n");

  /* ========= INIT ========= */
  useEffect(() => {
    if (mainMessages.length === 0) {
      sendBot("שלום וברוכה הבאה 🌸 מה שמך?");
      setStep("greet");
    }
    // eslint-disable-next-line
  }, []);

  /* ========= MENUS ========= */
  const showMainMenu = () => {
    sendBot("בחרי פעולה:");
    sendBot(
      "1️⃣ הרשמה לשיעור\n2️⃣ שאלות ותשובות\n3️⃣ תמיכה רגשית"
    );
    setStep("main_menu");
  };

  const showSearchMenu = () => {
    sendBot("איך תרצי לחפש שיעור?");
    sendBot("1️⃣ כל השיעורים\n2️⃣ לפי עיר\n3️⃣ לפי נושא");
    setStep("search_menu");
  };

  /* ========= LOGIN ========= */
  const handleName = async () => {
    const name = mainInput.trim();
    if (!name) return sendBot("נא להזין שם.");

    try {
      const res = await axios.post("/api/check-user", { name });
      if (!res.data.exists) {
        sendBot("השם לא נמצא במערכת. נסי שוב:");
        return;
      }
      setUserName(name);
      sendBot(`נעים מאוד ${name} 💙`);
      showMainMenu();
    } catch {
      sendBot("שגיאה בחיבור לשרת.");
    }
  };

  /* ========= LESSON SEARCH ========= */
  const loadAllLessons = async () => {
    try {
      const res = await axios.get("/api/lessons");
      if (!res.data.lessons.length) {
        sendBot("לא נמצאו שיעורים.");
        return showMainMenu();
      }

      setLessons(res.data.lessons);
      sendBot("רשימת השיעורים:");
      res.data.lessons.forEach((l, i) => sendBot(formatLesson(l, i)));
      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בטעינת שיעורים.");
      showMainMenu();
    }
  };

  const searchByCity = async (raw) => {
     const city = raw.trim();

    if (!city) return sendBot("נא להזין עיר.");

    try {
      const res = await axios.get(`/api/lessons?city=${city}`);
      if (!res.data.lessons.length) {
        sendBot("לא נמצאו שיעורים בעיר זו.");
        return showSearchMenu();
      }

      setLessons(res.data.lessons);
      res.data.lessons.forEach((l, i) => sendBot(formatLesson(l, i)));
      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בחיפוש לפי עיר.");
      showSearchMenu();
    }
  };

  const searchByTopic = async (raw) => {
  const topic = raw.trim();
    if (!topic) return sendBot("נא להזין נושא.");

    try {
      const res = await axios.get(`/api/lessons?topic=${topic}`);
      if (!res.data.lessons.length) {
        sendBot("לא נמצאו שיעורים בנושא זה.");
        return showSearchMenu();
      }

      setLessons(res.data.lessons);
      res.data.lessons.forEach((l, i) => sendBot(formatLesson(l, i)));
      sendBot("הקלידי מספר שיעור:");
      setStep("register");
    } catch {
      sendBot("שגיאה בחיפוש לפי נושא.");
      showSearchMenu();
    }
  };

  /* ========= REGISTER (שלב 1) ========= */
  const handleRegister = async (raw) => {
  const index = Number(raw.trim()) - 1;
    if (isNaN(index) || index < 0 || index >= lessons.length) {
      return sendBot("מספר לא תקין.");
    }

    const lesson = lessons[index];

    try {
      const res = await axios.post("/api/register", {
        name: userName,
        lesson_id: lesson.lesson_id,
      });

      if (res.data.status === "FULL") {
        sendBot("השיעור מלא ❌");
        return showSearchMenu();
      }

      sendBot(`נרשמת לשיעור: ${lesson.title} ✅`);
      sendBot("1️⃣ חזרה לתפריט\n2️⃣ חיפוש נוסף");
      setStep("after_register");
    } catch {
      sendBot("שגיאה בהרשמה לשיעור ❌");
      showSearchMenu();
    }
  };

  const handleAfterRegister = (raw) => {
      const c = raw.trim();

    if (c === "1") showMainMenu();
    else if (c === "2") showSearchMenu();
    else sendBot("נא לבחור 1 או 2");
  };

  /* ========= FAQ ========= */
  const startFAQ = () => {
    sendBot("בחרי נושא לשאלות:");
    sendBot(
      "1️⃣ שאלות על שיעורים\n2️⃣ שאלות על העמותה\n3️⃣ שאלות על המנחים\n0️⃣ חזרה"
    );
    setFaqMode("choose");
    setStep("faq");
  };

  const handleFAQ = async () => {
    const text = mainInput.trim();

    if (faqMode === "choose") {
      if (text === "0") return showMainMenu();

      if (text === "1") {
        setFaqType("LESSONS");
        const res = await axios.get("/api/lessons");
        setLessons(res.data.lessons);
        sendBot("בחרי שיעור:");
        res.data.lessons.forEach((l, i) =>
          sendBot(`${i + 1}. ${l.title}`)
        );
        setFaqMode("chooseLesson");
        return;
      }

      if (text === "2") {
        setFaqType("ORG");
        setFaqMode("ask");
        return sendBot("שאלי כל שאלה על העמותה 🌱");
      }

      if (text === "3") {
        setFaqType("INSTRUCTORS");
        setFaqMode("ask");
        return sendBot("שאלי כל שאלה על המנחים 💙");
      }
    }

    if (faqMode === "chooseLesson") {
      const lesson = lessons[Number(text) - 1];
      if (!lesson) return sendBot("בחירה לא תקינה.");
      setFaqSelectedLesson(lesson);
      setFaqMode("ask");
      return sendBot(`איזו שאלה יש לך על "${lesson.title}"?`);
    }

    if (faqMode === "ask") {
      const res = await axios.post("/api/faq", {
        type: faqType,
        question: text,
        lesson: faqSelectedLesson,
      });
      sendBot(res.data.answer);
      showMainMenu();
    }
  };

  /* ========= EMOTIONAL ========= */
  const handleEmotionalSupport = async () => {
    const feeling = mainInput.trim();
    if (!feeling) return sendBot("מה את מרגישה?");

    sendBot("יוצרת עבורך תרגול 🧘‍♀️");
    const res = await axios.post("/api/emotional-support", {
      feeling,
      userName,
    });

    const ex = res.data.mindfulness_exercise;
    sendBot(`🧘‍♀️ ${ex.title}`);
    ex.steps.forEach((s, i) => sendBot(`שלב ${i + 1}: ${s}`));
    showMainMenu();
  };

  /* ========= ROUTER ========= */
  const handlers = {
    greet: handleName,
    main_menu: (raw) => {
      const c = normalizeChoice(raw);
      if (c === "1") showSearchMenu();
      else if (c === "2") startFAQ();
      else if (c === "3") {
        sendBot("מה את מרגישה עכשיו?");
        setStep("emotional");
      } else sendBot("בחירה לא תקינה.");
    },
    search_menu: (raw) => {
       const c = normalizeChoice(raw);
      if (c === "1") loadAllLessons();
      else if (c === "2") {
        sendBot("הקלידי עיר:");
        setStep("search_city");
      } else if (c === "3") {
        sendBot("הקלידי נושא:");
        setStep("search_topic");
      } else sendBot("בחירה לא תקינה.");
    },
    search_city: searchByCity,
    search_topic: searchByTopic,
    register: handleRegister,
    after_register: handleAfterRegister,
    faq: handleFAQ,
    emotional: handleEmotionalSupport,
  };

  const handleSend = () => {
    if (!mainInput.trim()) return;

    const text = mainInput.trim();
    const currentStep = step;

    sendUser(text);

    if (handlers[currentStep]) {
      handlers[currentStep](text);
    } else {
      sendBot("משהו השתבש, חוזרים לתפריט");
      showMainMenu();
    }

    setMainInput("");
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {mainMessages.map((m, i) => (
          <div key={i} className={m.sender}>{m.text}</div>
        ))}
      </div>

      <div className="input-box">
        <input
          value={mainInput}
          onChange={(e) => setMainInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="הקלידי כאן..."
        />
        <button onClick={handleSend}>שליחה</button>
      </div>
    </div>
  );
}

export default Chat;
