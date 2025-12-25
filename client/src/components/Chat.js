import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import "../styles/Chat.css";
import { ChatContext } from "../contexts/ChatContext";

function Chat() {
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

  // 🔹 FAQ state (מקומי, פשוט)
  const [faqMode, setFaqMode] = useState("choose");
  const [faqType, setFaqType] = useState(null);
  const [faqSelectedLesson, setFaqSelectedLesson] = useState(null);

  const sendBot = (text) =>
    setMainMessages((prev) => [...prev, { sender: "bot", text }]);

  const sendUser = (text) =>
    setMainMessages((prev) => [...prev, { sender: "user", text }]);

  useEffect(() => {
    if (mainMessages.length === 0) {
      sendBot("שלום וברכה! מה שמך?");
      setStep("greet");
    }
    // eslint-disable-next-line
  }, []);

  /* ---------- תפריט ראשי ---------- */
  const showMainMenu = () => {
    sendBot("בחרי פעולה:");
    sendBot(
      ["1 - הרשמה לשיעור", "2 - שאלות ותשובות", "3 - תמיכה רגשית"].join("\n")
    );
    setStep("main_menu");
  };

  /* ---------- התחברות ---------- */
  const handleName = async () => {
    const name = mainInput.trim();
    if (!name) return sendBot("נא להזין שם.");

    try {
      const res = await axios.post("http://localhost:5000/api/check-user", { name });
      if (!res.data.exists) {
        sendBot("השם לא נמצא במערכת. נסי שוב:");
        return;
      }

      setUserName(name);
      sendBot(`נעים מאוד ${name}.`);
      showMainMenu();
    } catch {
      sendBot("שגיאה בשרת.");
    }
  };

  /* ---------- FAQ ---------- */
  const startFAQ = () => {
    sendBot("בחרי נושא לשאלות:");
    sendBot(
      [
        "1️⃣ שאלות על שיעורים",
        "2️⃣ שאלות על העמותה",
        "3️⃣ שאלות על המנחים",
        "0️⃣ חזרה לתפריט הראשי",
      ].join("\n")
    );
    setFaqMode("choose");
    setStep("faq");
  };

  const handleFAQ = async () => {
    const text = mainInput.trim();

    if (faqMode === "choose") {
      if (text === "1") {
        setFaqType("LESSONS");
        const res = await axios.get("http://localhost:5000/api/lessons");
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
        sendBot("שאלי כל שאלה על העמותה 🌱");
        setFaqMode("ask");
        return;
      }

      if (text === "3") {
        setFaqType("INSTRUCTORS");
        sendBot("שאלי כל שאלה על המנחים 💙");
        setFaqMode("ask");
        return;
      }

      if (text === "0") {
        showMainMenu();
        return;
      }
    }

    if (faqMode === "chooseLesson") {
      const lesson = lessons[Number(text) - 1];
      if (!lesson) return sendBot("בחירה לא תקינה.");
      setFaqSelectedLesson(lesson);
      sendBot(`איזו שאלה יש לך על "${lesson.title}"?`);
      setFaqMode("ask");
      return;
    }

    if (faqMode === "ask") {
      const res = await axios.post("http://localhost:5000/api/faq", {
        type: faqType,
        question: text,
        lesson: faqSelectedLesson,
      });

      sendBot(res.data.answer);
      sendBot("1️⃣ שאלה נוספת\n2️⃣ נושא אחר\n0️⃣ חזרה");
      setFaqMode("after");
      return;
    }

    if (faqMode === "after") {
      if (text === "1") {
        setFaqMode("ask");
      } else if (text === "2") {
        startFAQ();
      } else if (text === "0") {
        showMainMenu();
      } else {
        sendBot("נא לבחור 1, 2 או 0");
      }
    }
  };

  /* ---------- handlers ---------- */
  const handlers = {
    greet: handleName,
    main_menu: () => {
      const choice = mainInput.trim();
      if (choice === "1") sendBot("הרשמה – ממשיך כרגיל (הקוד שלך נשאר)");
      else if (choice === "2") startFAQ();
      else if (choice === "3") {
        sendBot("מה את מרגישה עכשיו?");
        setStep("emotional_feeling");
      } else sendBot("בחירה לא תקינה.");
    },
    faq: handleFAQ,
    emotional_feeling: async () => {
      const feeling = mainInput.trim();
      sendBot("יוצרת עבורך תרגול...");
      const res = await axios.post("http://localhost:5000/api/emotional-support", {
        feeling,
        userName,
      });
      const ex = res.data.mindfulness_exercise;
      sendBot(`🧘‍♀️ ${ex.title}`);
      ex.steps.forEach((s, i) => sendBot(`שלב ${i + 1}: ${s}`));
      showMainMenu();
    },
  };

  const handleSend = () => {
    if (!mainInput.trim()) return;
    sendUser(mainInput);
    if (handlers[step]) handlers[step]();
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
        />
        <button onClick={handleSend}>שליחה</button>
      </div>
    </div>
  );
}

export default Chat;
