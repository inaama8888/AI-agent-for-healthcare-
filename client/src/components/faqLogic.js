import axios from "axios";

export async function faqLogic({
  text,
  faqMode,
  setFaqMode,
  faqType,
  setFaqType,
  faqSelectedLesson,
  setFaqSelectedLesson,
  lessons,
  setLessons,
  sendBot,
  backToMain,
}) {
  if (faqMode === "choose") {
    if (text === "1") {
      setFaqType("LESSONS");
      const res = await axios.get("http://localhost:5000/api/lessons");

      sendBot("בחרי שיעור:");
      res.data.lessons.forEach((l, i) =>
        sendBot(`${i + 1}. ${l.title}`)
      );

      setLessons(res.data.lessons);
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
      backToMain();
      return;
    }

    sendBot("בחירה לא תקינה");
    return;
  }

  if (faqMode === "chooseLesson") {
    const lesson = lessons[Number(text) - 1];
    if (!lesson) {
      sendBot("בחירה לא תקינה");
      return;
    }

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
      setFaqType(null);
      setFaqSelectedLesson(null);
      setFaqMode("choose");
      sendBot("בחרי נושא לשאלות:");
    } else if (text === "0") {
      backToMain();
    } else {
      sendBot("נא לבחור 1, 2 או 0");
    }
  }
}
