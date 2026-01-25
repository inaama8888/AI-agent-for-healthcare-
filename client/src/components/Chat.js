import React, { useEffect, useState,useRef } from "react";
import axios from "axios";
import "../styles/Chat.css";
import { API_BASE } from "../config";


function Chat() {
const normalizeChoice = (raw) => {
  const t = (raw || "").toLowerCase();

  if (t.includes("1") || t.includes("הרשמה")) return "1";
  if (t.includes("2") || t.includes("שאלות")) return "2";
  if (t.includes("3") || t.includes("תמיכה") || t.includes("רגש")) return "3";

  return raw.trim();
};


  const [faqMode, setFaqMode] = useState("choose");
  const [faqType, setFaqType] = useState(null);
  const [userPhone, setUserPhone] = useState("");
  const [lastSearchCity, setLastSearchCity] = useState("");
  const [isTyping, setIsTyping] = useState(false);


   // 🔹 במקום Context
  const [mainMessages, setMainMessages] = useState([]);
  const [mainInput, setMainInput] = useState("");
  const [step, setStep] = useState("ask_phone");
  const [userName, setUserName] = useState("");
  const [lessons, setLessons] = useState([]);

const endRef = useRef(null);



  const [faqSelectedLesson, setFaqSelectedLesson] = useState(null);

const sendBot = (text, type = "normal", isHtml = false) =>
  setMainMessages((prev) => [
    ...prev,
    { sender: "bot", text, type, isHtml },
  ]);

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
 
const isValidIsraeliPhone = (phone) => {
  const cleaned = phone.replace(/[\s-]/g, "");

  const israelPhoneRegex =
    /^(?:\+972|972|0)(5[0-9]|[23489])[0-9]{7}$/;

  return israelPhoneRegex.test(cleaned);
};

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

  useEffect(() => {
    if (mainMessages.length === 0) {
sendBot("שלום, טוב שבאת. כדי שנוכל להתחיל, אשמח למספר הטלפון שלך.");
setStep("ask_phone");
    }
  }, []);


  
  const showMainMenu = () => {
sendBot("איך תרצה להמשיך מכאן? 🌱");
    sendBot(
      "1️⃣ הרשמה לשיעור\n2️⃣ שאלות ותשובות\n3️⃣ תמיכה רגשית"
    );
    setStep("main_menu");
  };

  const showSearchMenu = () => {
    sendBot("איך תרצה לחפש שיעור?");
    sendBot(
    "1️⃣ כל השיעורים\n" +
    "2️⃣ לפי עיר\n" +
    "3️⃣ לפי נושא\n" +
    "4️⃣ לפי מנחה\n\n" +
    "0️⃣תפריט ראשי |9️⃣ חזרה אחורה"
  );
    setStep("search_menu");
  };

const handlePhone = async () => {
  const phone = mainInput.trim();
  if (!phone) return sendBot("נא להזין מספר טלפון");
 if (!isValidIsraeliPhone(phone)) {
    return sendBot(
      "❌ מספר הטלפון לא תקין\nנא להזין מספר ישראלי (לדוגמה: 0501234567)"
    );
  }

  try {
    const res = await axios.post("/api/check-user", { phone });
    setUserPhone(phone);

    if (res.data.status === "APPROVED") {
      setUserName(res.data.user.full_name);
      sendBot(`שלום ${res.data.user.full_name} 💙`);
      showMainMenu();
      return;
    }

    if (res.data.status === "PENDING") {
      sendBot("הבקשה שלך כבר התקבלה 🌿");
      sendBot("ניצור קשר לאחר אישור העמותה 💙");
      setStep("done");
      return;
    }

    if (res.data.status === "NEW") {
      sendBot("לא מצאנו אותך במערכת. איך קוראים לך?");
      setStep("ask_name");
      return;
    }
  } catch (err) {
    console.error(err);
    sendBot("שגיאה בחיבור לשרת");
  }
};

const handleNewUserName = async () => {
  const name = mainInput.trim();
  if (!name) return sendBot("נא להזין שם");

  setUserName(name);
  sendBot(`תודה ${name} 💙`);
  sendBot("רוצה לשתף בקצרה מה הביא אותך אלינו? (אפשר בקצרה)");
  setStep("ask_reason");
};


const handleAskReason = async () => {
  const reason = mainInput.trim();

  try {
    await axios.post("/api/pending-users", {
      full_name: userName,
      phone: userPhone,
      reason,
    });

    sendBot("הבקשה נקלטה 🌱");
    sendBot("נחזור אלייך לאחר אישור העמותה 💙");
    setStep("done");
  } catch (err) {
    console.error(err);
    sendBot("שגיאה בשמירת הבקשה");
  }
};
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
sendBot("0️⃣ תפריט ראשי\n9️⃣ חזרה אחורה");
      setStep("register");
    } catch {
      sendBot("שגיאה בטעינת שיעורים.");
      showMainMenu();
    }
  };

 const searchByCity = async (raw) => {
  const city = raw.trim();
  if (!city) return sendBot("נא להזין עיר.");
  setLastSearchCity(city);
  try {
    const res = await axios.get(
      `${API_BASE}/api/lessons?city=${encodeURIComponent(city)}`
    );

    if (!res.data.lessons.length) {
    
  sendBot(`לא מצאנו שיעורים בעיר ${city} 🌿`);
  sendBot("אחפש עבורך שיעורים קרובים...");
  return searchNearby(city);
    }

    setLessons(res.data.lessons);
    res.data.lessons.forEach((l, i) =>
      sendBot(formatLesson(l, i))
    );

sendBot("הקלד מספר שיעור");
sendBot("0️⃣ תפריט ראשי\n9️⃣  חזרה אחורה");
    setStep("register");
  } catch {
    sendBot("שגיאה בחיפוש לפי עיר.");
    showSearchMenu();
  }
};


const searchNearby = async (city) => {
  try {
const res = await axios.post(`${API_BASE}/api/lessons/nearby`, { city });

if (res.data.status === "CITY_NOT_FOUND") {
  sendBot(`לא הצלחתי לזהות את "${city}" כעיר בישראל 🌿`);
  showSearchMenu();
  return;
}

    if (!res.data.nearby.length) {
  sendBot(
    `לא נמצאו שיעורים בטווח של עד 10 ק״מ מהעיר ${city} 📍`
  );
  sendBot(
    "השיעורים מוצגים לפי קרבה גיאוגרפית, כדי לשמור על נגישות 🌿"
  );
  sendBot("אפשר לבחור דרך אחרת לחיפוש:");
  showSearchMenu();
  return;
}

    sendBot("מצאתי עבורך שיעורים קרובים 🌍");
    setLessons(res.data.nearby);

    res.data.nearby.forEach((l, i) =>
   sendBot(
  `${i + 1}. ${l.title}\n📍 ${l.city}  ·  📏 ${l.distance.toFixed(1)} ק״מ`
)
    );

    sendBot("הקלד מספר שיעור");
    setStep("register");
  } catch (err) {
    console.error(err);
    sendBot("שגיאה בחיפוש שיעורים קרובים");
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
sendBot("0️⃣ תפריט ראשי\n9️⃣ חזרה אחורה");
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

sendBot(
  `
  <div class="calendar-wrapper">
    <div class="calendar-title">📅 הוספת תזכורת ליומן</div>
    <a href="${calendarLink}" target="_blank" class="calendar-btn">
      ➕ הוספה ליומן Google
    </a>
  </div>
  `,
  "normal",
  true
);

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
    else sendBot("נא לבחור 1️⃣ או 2️⃣");
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
    if (!/^\d+$/.test(text)) {
      sendBot("כאן צריך לבחור מספר 🌿");
      sendBot(
        "1️⃣ שאלות על שיעורים\n" +
        "2️⃣ שאלות על העמותה\n" +
        "3️⃣ שאלות על המנחים\n\n" +
        "0️⃣ חזרה לתפריט הראשי"
      );
      return;
    }

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
      sendBot("שאלי כל שאלה על העמותה 🌱");
      return;
    }

    if (text === "3") {
      setFaqType("INSTRUCTORS");
      setFaqMode("ask");
      sendBot("שאלי כל שאלה על המנחים 💙");
      sendBot("לדוגמה: מה ההכשרה של המנחים?");
      return;
    }

    sendBot("בחירה לא תקינה.");
    return;
  }

  // ===== שלב בחירת שיעור =====
  if (faqMode === "chooseLesson") {
    if (!/^\d+$/.test(text)) {
      return sendBot("נא לבחור מספר שיעור תקין");
    }

    const lesson = lessons[Number(text) - 1];
    if (!lesson) return sendBot("בחירה לא תקינה.");

    setFaqSelectedLesson(lesson);
    setFaqMode("ask");
    sendBot(`איזו שאלה יש לך על "${lesson.title}"?`);
    return;
  }

  if (faqMode === "ask") {
    try {
      setIsTyping(true);

      const res = await axios.post("/api/faq", {
        type: faqType,
        question: text,
        lesson: faqSelectedLesson,
      });

      setIsTyping(false);
      sendBot(res.data.answer);
      showMainMenu();
    } catch (err) {
      setIsTyping(false);
      sendBot("אירעה שגיאה במענה לשאלה ❌");
    }
  }
};


const handleEmotionalSupport = async () => {
  const feeling = mainInput.trim();
  if (!feeling) return sendBot("מה אתה מרגיש?");

  try {
    setIsTyping(true); // 👈 הבינה "חושבת"

    const res = await axios.post("/api/emotional-support", {
      feeling,
      phone: userPhone,
    });

    setIsTyping(false);

    const ex = res.data.mindfulness_exercise;
    sendBot(`🧘‍♀️ ${ex.title}`);
    ex.steps.forEach((s, i) => sendBot(`שלב ${i + 1}: ${s}`));
    showMainMenu();
  } catch (err) {
    setIsTyping(false);
    sendBot("לא הצלחתי ליצור תרגול כרגע 🌿");
  }
};


 const handlers = {
  // ✅ זיהוי חדש לפי טלפון
  ask_phone: handlePhone,
  

  main_menu: (raw) => {
    const c = normalizeChoice(raw);
    if (c === "1") showSearchMenu();
    else if (c === "2") startFAQ();
    else if (c === "3") {
     sendBot("מה אתה מרגיש עכשיו?");
      setStep("emotional");
    } else sendBot("בחירה לא תקינה. הזן מספר תקין");
  },

  search_menu: (raw) => {
    const c = normalizeChoice(raw);

    if (c === "1") loadAllLessons();
    else if (c === "2") {
      sendBot("הקלד שם עיר בישראל (לדוגמה: תל אביב, חיפה):");
      setStep("search_city");
    }
    else if (c === "3") {
      sendBot("הקלד נושא:");
      setStep("search_topic");
    }
    else if (c === "4") {
      sendBot("הקלד שם מנחה:");
      setStep("search_instructor");
    }
    else sendBot("בחירה לא תקינה. הזן מספר תקין");
  },

  search_city: searchByCity,
  search_topic: searchByTopic,
  search_instructor: searchByInstructor,

  register: handleRegister,
  after_register: handleAfterRegister,

  faq: handleFAQ,
  emotional: handleEmotionalSupport,
 // ask_nearby_city: askNearbyCity,
   ask_reason: handleAskReason,
 ask_name: handleNewUserName,

 
};


  const goHome = () => {
  sendBot("חזרה לתפריט הראשי 🏠");
  showMainMenu();
  setStep("main_menu");
};

const goBack = () => {
  const backMap = {
    search_city: "search_menu",
    search_topic: "search_menu",
    search_instructor: "search_menu",
    register: "search_menu",

    search_menu: "main_menu",
    faq: "main_menu",
    emotional: "main_menu",
    after_register: "main_menu",
  };

  const prev = backMap[step] || "main_menu";

  sendBot("🔙 חזרנו אחורה");

  setStep(prev);

  if (prev === "main_menu") {
    showMainMenu();
  }

  if (prev === "search_menu") {
    showSearchMenu();
  }
};


const handleSend = () => {
  if (!mainInput.trim()) return;

  const text = mainInput.trim();
  sendUser(text);
  setMainInput("");

  // 🔥 תמיד תופס קודם
  if (text === "0") {
    return goHome();
  }

  if (text === "9") {
    return goBack();
  }

  const handler = handlers[step];
  if (handler) {
    handler(text);
  } else {
    sendBot("משהו השתבש, חוזרים לתפריט");
    showMainMenu();
  }
};

useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: "smooth" });
}, [mainMessages]);
return (
  <div className="app-shell">
    <div className="chat-container">

      <div className="chat-header">
        זהבה – מרחב לתמיכה וחוסן
      </div>

      <div className="messages">
  {mainMessages.map((m, i) => (
    <div key={i} className={`message ${m.sender}`}>
      
      {/* תוכן ההודעה */}
      {m.isHtml ? (
        <div
          className="message-html"
          dangerouslySetInnerHTML={{ __html: m.text }}
        />
      ) : (
        <div className="message-text">
          {m.text}
        </div>
      )}

      {/* בחירות (אם יש) */}
      {m.choices && (
        <div className="choices">
          {m.choices.map((c, idx) => (
            <div
              key={idx}
              className="choice-chip"
              // בעתיד אפשר להחזיר:
              // onClick={() => handleChoice(c.value)}
            >
              {c.label}
            </div>
          ))}
        </div>
      )}

    </div>
  ))}

  <div ref={endRef} />
</div>

 {isTyping && (
    <div className="message bot typing">
      <span />
      <span />
      <span />
    </div>
  )}
      <div className="input-box">
        <div className="input-inner">
          <input
            value={mainInput}
            onChange={(e) => setMainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="אפשר לכתוב כאן, בקצב שלך…"
          />
          <button className="send-btn" onClick={handleSend}>➤</button>
        </div>
      </div>

    </div>
  </div>
);







}

export default Chat;