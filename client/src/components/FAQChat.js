import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import "../styles/Chat.css";
import { ChatContext } from "../contexts/ChatContext";

function FAQChat() {
  const {
    faqMessages,
    setFaqMessages,
    faqInput,
    setFaqInput,
    faqMode,
    setFaqMode,
    faqType,
    setFaqType,
    faqSelectedLesson,
    setFaqSelectedLesson,
    setScreen,
  } = useContext(ChatContext);

  const [lessons, setLessons] = useState([]);

  const sendBot = (text) =>
    setFaqMessages((prev) => [...prev, { sender: "bot", text }]);

  const sendUser = (text) =>
    setFaqMessages((prev) => [...prev, { sender: "user", text }]);

  // הודעת פתיחה – רק פעם אחת
  useEffect(() => {
    if (faqMessages.length === 0) {
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
    }
    // eslint-disable-next-line
  }, []);

  const loadLessons = async () => {
    const res = await axios.get("http://localhost:5000/api/lessons");
    setLessons(res.data.lessons);

    sendBot("בחרי שיעור:");
    res.data.lessons.forEach((l, i) => sendBot(`${i + 1}. ${l.title}`));
    setFaqMode("chooseLesson");
  };

  const sendQuestion = async (question) => {
    const res = await axios.post("http://localhost:5000/api/faq", {
      type: faqType,
      question,
      lesson: faqSelectedLesson,
    });

    sendBot(res.data.answer);
    sendBot("מה תרצי לעשות עכשיו?");
    sendBot("1️⃣ שאלה נוספת\n2️⃣ נושא אחר\n0️⃣ חזרה");
    setFaqMode("after");
  };

  const handleSend = () => {
    if (!faqInput.trim()) return;

    const text = faqInput.trim();
    sendUser(text);

    if (faqMode === "choose") {
      if (text === "1") {
        setFaqType("LESSONS");
        loadLessons();
      } else if (text === "2") {
        setFaqType("ORG");
        sendBot("שאלי כל שאלה על העמותה 🌱");
        setFaqMode("ask");
      } else if (text === "3") {
        setFaqType("INSTRUCTORS");
        sendBot("שאלי כל שאלה על המנחים 💙");
        setFaqMode("ask");
      } else if (text === "0") {
        setScreen("main");
      } else {
        sendBot("בחירה לא תקינה");
      }
      setFaqInput("");
      return;
    }

    if (faqMode === "chooseLesson") {
      const lesson = lessons[Number(text) - 1];
      if (!lesson) sendBot("בחירה לא תקינה");
      else {
        setFaqSelectedLesson(lesson);
        sendBot(`איזו שאלה יש לך על "${lesson.title}"?`);
        setFaqMode("ask");
      }
      setFaqInput("");
      return;
    }

    if (faqMode === "ask") {
      sendQuestion(text);
      setFaqInput("");
      return;
    }

    if (faqMode === "after") {
      if (text === "1") setFaqMode("ask");
      else if (text === "2") {
        setFaqType(null);
        setFaqSelectedLesson(null);
        setFaqMode("choose");
        sendBot("בחרי נושא לשאלות:");
      } else if (text === "0") {
        setScreen("main");
      } else sendBot("נא לבחור 1, 2 או 0");
      setFaqInput("");
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {faqMessages.map((m, i) => (
          <div key={i} className={m.sender}>{m.text}</div>
        ))}
      </div>

      <div className="input-box">
        <input
          value={faqInput}
          onChange={(e) => setFaqInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>שליחה</button>
      </div>
    </div>
  );
}

export default FAQChat;
