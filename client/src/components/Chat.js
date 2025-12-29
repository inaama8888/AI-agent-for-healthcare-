import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import "../styles/Chat.css";
import { ChatContext } from "../contexts/ChatContext";
import { API_BASE } from "../config";
const NAV_HOME = "0";
const NAV_BACK = "9";

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
  const [userPhone, setUserPhone] = useState("");
const [lastRegisteredLesson, setLastRegisteredLesson] = useState(null);



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
      `מיקום: ${l.city || "ZOOM"}`,
      `תאריך: ${formatDate(l.date)}`,
      `מנחה: ${l.instructor || "-"}`,
      `מקומות: ${l.seats ?? "-"}`,
      
    ].join("\n");
 


      // ===== Google Calendar Link =====
  const createGoogleCalendarLink = (lesson) => {
    const start = new Date(lesson.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // שעה

    const formatGoogleDate = (d) =>
      d.toISOString().replace(/[-:]|\.\d{3}/g, "");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: lesson.title,
      dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
      details: `שיעור מיינדפולנס\nמנחה: ${lesson.instructor || ""}`,
      location: lesson.city || "ZOOM",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  /* ========= INIT ========= */
  useEffect(() => {
    if (mainMessages.length === 0) {
    sendBot("שלום וברוך הבא 🌸 נא להזין מספר טלפון:");
setStep("ask_phone");
    }
    // eslint-disable-next-line
  }, []);

  /* ========= MENUS ========= */
  const showMainMenu = () => {
    sendBot("בחר פעולה:");
    sendBot(
      "1️⃣ הרשמה לשיעור\n2️⃣ שאלות ותשובות\n3️⃣ תמיכה רגשית"
    );
    setStep("main_menu");
  };

  const showSearchMenu = () => {
    sendBot("איך תרצה לחפש שיעור?");
    sendBot(
    "1 - כל השיעורים\n" +
    "2 - לפי עיר\n" +
    "3 - לפי נושא\n" +
    "4 - לפי מנחה\n\n" +
    "0 - תפריט ראשי | 9 - חזרה אחורה"
  );
    setStep("search_menu");
  };

  /* ========= LOGIN ========= */
const handlePhone = async () => {
  const phone = mainInput.trim();

  if (!phone) {
    return sendBot("נא להזין מספר טלפון");
  }

  try {
    const res = await axios.post("/api/check-user", { phone });

    setUserPhone(phone);

    if (res.data.exists) {
  const fullName = res.data.user.full_name;

setUserName(fullName);

sendBot(`שלום ${fullName} `);
sendBot("מה תרצה לעשות היום?");
      showMainMenu();
    } else {
      sendBot("לא מצאנו אותך במערכת. איך קוראים לך?");
      setStep("ask_name");
    }
  } catch (err) {
    console.error(err);
    sendBot("שגיאה בחיבור לשרת");
  }
};
 const handleNewUserName = async () => {
  const name = mainInput.trim();

  if (!name) {
    return sendBot("נא להזין שם");
  }

  try {
    await axios.post("/api/create-user", {
      phone: userPhone,
      full_name: name,
    });

    sendBot(`נעים מאוד ${name} 💙`);
    showMainMenu();
  } catch (err) {
    console.error(err);
    sendBot("שגיאה ביצירת משתמש");
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
sendBot("הקלד מספר שיעור");
sendBot("0 - תפריט ראשי\n9 - חזרה אחורה");
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
    const res = await axios.get(
      `${API_BASE}/api/lessons?city=${encodeURIComponent(city)}`
    );

    if (!res.data.lessons.length) {
      sendBot("לא נמצאו שיעורים בעיר זו.");
      return showSearchMenu();
    }

    setLessons(res.data.lessons);
    res.data.lessons.forEach((l, i) =>
      sendBot(formatLesson(l, i))
    );

sendBot("הקלד מספר שיעור");
sendBot("0 - תפריט ראשי\n9 - חזרה אחורה");
    setStep("register");
  } catch {
    sendBot("שגיאה בחיפוש לפי עיר.");
    showSearchMenu();
  }
};

const searchByInstructor = async (raw) => {
  const instructor = raw.trim();
  if (!instructor) return sendBot("נא להזין שם מנחה.");

  try {
    const res = await axios.get(
      `${API_BASE}/api/lessons?instructor=${encodeURIComponent(instructor)}`
    );

    if (!res.data.lessons.length) {
      sendBot("לא נמצאו שיעורים עם מנחה זה.");
      return showSearchMenu();
    }

    setLessons(res.data.lessons);
    res.data.lessons.forEach((l, i) => sendBot(formatLesson(l, i)));

sendBot("הקלד מספר שיעור");
sendBot("0 - תפריט ראשי\n9 - חזרה אחורה");
    setStep("register");
  } catch {
    sendBot("שגיאה בחיפוש לפי מנחה.");
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
sendBot("הקלד מספר שיעור");
sendBot("0 - תפריט ראשי\n9 - חזרה אחורה");
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
      phone: userPhone,
      lesson_id: lesson.lesson_id,
    });

    if (res.data.status === "FULL") {
      sendBot("השיעור מלא ❌");
      return showSearchMenu();
    }

    sendBot(`נרשמת לשיעור: ${lesson.title} `);
const calendarLink = createGoogleCalendarLink(lesson);

sendBot(`
📅 להוספת תזכורת ליומן<br/>
<a href="${calendarLink}" target="_blank" class="calendar-btn">
  ➕ הוספה ליומן Google
</a>
`);

sendBot("1️⃣ חזרה לתפריט\n2️⃣ חיפוש נוסף");
setStep("after_register");

   


  } catch (err) {
    console.error(err);
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
    sendBot("בחר נושא לשאלות:");
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
  phone: userPhone,
    });

    const ex = res.data.mindfulness_exercise;
    sendBot(`🧘‍♀️ ${ex.title}`);
    ex.steps.forEach((s, i) => sendBot(`שלב ${i + 1}: ${s}`));
    showMainMenu();
  };

  /* ========= ROUTER ========= */
 const handlers = {
  // ✅ זיהוי חדש לפי טלפון
  ask_phone: handlePhone,
  ask_name: handleNewUserName,

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
    }
    else if (c === "3") {
      sendBot("הקלידי נושא:");
      setStep("search_topic");
    }
    else if (c === "4") {
      sendBot("הקלידי שם מנחה:");
      setStep("search_instructor");
    }
    else sendBot("בחירה לא תקינה.");
  },

  search_city: searchByCity,
  search_topic: searchByTopic,
  search_instructor: searchByInstructor,

  register: handleRegister,
  after_register: handleAfterRegister,

  faq: handleFAQ,
  emotional: handleEmotionalSupport,


 
};


  const goHome = () => {
  sendBot("חזרה לתפריט הראשי 🏠");
  showMainMenu();
  setStep("main_menu");
};

const goBack = () => {
  sendBot("חזרה אחורה 🔙");

  // מיפוי פשוט של שלבים לאחור
  const backMap = {
    search_city: "choose_search_method",
    search_topic: "choose_search_method",
    register: "choose_search_method",
    emotional_feeling: "main_menu",
    choose_search_method: "main_menu",
    after_register_menu: "main_menu",
  };

  const prev = backMap[step] || "main_menu";
  setStep(prev);

  if (prev === "main_menu") showMainMenu();
  else if (prev === "choose_search_method") {
    sendBot("כיצד תרצי לחפש שיעור?");
    sendBot(["1 - כל השיעורים", "2 - לפי עיר", "3 - לפי נושא", "0 - חזרה"].join("\n"));
  }
};

const handleSend = () => {
  if (!mainInput.trim()) return;

  const text = mainInput.trim();
  sendUser(text);

  // ניווט גלובלי – עובד מכל שלב
  if (text === "0") {
    setMainInput("");
    return goHome();
  }

  if (text === "9") {
    setMainInput("");
    return goBack();
  }

  const currentStep = step;

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
         <div
  key={i}
  className={m.sender}
  dangerouslySetInnerHTML={{ __html: m.text }}
/>
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
