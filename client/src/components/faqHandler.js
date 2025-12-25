import axios from "axios";

export async function faqHandler({
  text,
  faqState,
  setFaqState,
  sendBot,
}) {
  // מצב התחלתי – רק נכנסנו מ־2
  if (faqState.mode === "init") {
    sendBot("בחרי נושא לשאלות:");
    sendBot(
      "1️⃣ שאלות על שיעורים\n2️⃣ שאלות על העמותה\n3️⃣ שאלות על המנחים\n0️⃣ חזרה"
    );
    setFaqState({ ...faqState, mode: "choose" });
    return;
  }

  // בחירת נושא
  if (faqState.mode === "choose") {
    if (text === "1") {
      const res = await axios.get("http://localhost:5000/api/lessons");
      sendBot("בחרי שיעור:");
      res.data.lessons.forEach((l, i) =>
        sendBot(`${i + 1}. ${l.title}`)
      );
      setFaqState({ ...faqState, mode: "chooseLesson", lessons: res.data.lessons });
      return;
    }

    if (text === "2") {
      sendBot("שאלי כל שאלה על העמותה 🌱");
      setFaqState({ ...faqState, mode: "ask", type: "ORG" });
      return;
    }

    if (text === "3") {
      sendBot("שאלי כל שאלה על המנחים 💙");
      setFaqState({ ...faqState, mode: "ask", type: "INSTRUCTORS" });
      return;
    }

    if (text === "0") {
      sendBot("חוזרות לתפריט הראשי 😊");
      setFaqState({ mode: "off" });
      return;
    }

    sendBot("בחירה לא תקינה");
    return;
  }

  // בחירת שיעור
  if (faqState.mode === "chooseLesson") {
    const lesson = faqState.lessons[Number(text) - 1];
    if (!lesson) {
      sendBot("בחירה לא תקינה");
      return;
    }

    sendBot(`איזו שאלה יש לך על "${lesson.title}"?`);
    setFaqState({ ...faqState, mode: "ask", type: "LESSONS", lesson });
    return;
  }

  // שאלה
  if (faqState.mode === "ask") {
    const res = await axios.post("http://localhost:5000/api/faq", {
      type: faqState.type,
      question: text,
      lesson: faqState.lesson || null,
    });

    sendBot(res.data.answer);
    sendBot("1️⃣ שאלה נוספת\n0️⃣ חזרה");
    setFaqState({ ...faqState, mode: "after" });
    return;
  }

  // אחרי תשובה
  if (faqState.mode === "after") {
    if (text === "1") {
      sendBot("שאלי שאלה נוספת 🙂");
      setFaqState({ ...faqState, mode: "ask" });
      return;
    }

    if (text === "0") {
      sendBot("חוזרות לתפריט הראשי 😊");
      setFaqState({ mode: "off" });
      return;
    }

    sendBot("נא לבחור 1 או 0");
  }
}
