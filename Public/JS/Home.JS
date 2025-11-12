const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let step = "greet";
let userName = "";
let lessons = [];

window.onload = () => {
  addBotMessage("שלום וברוך הבא לסוכן לבריאות, תמיכה וחוסן! מה השם שלך?");
};

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addUserMessage(text);
  input.value = "";

  if (step === "greet") {
    userName = text;
    addBotMessage(`נעים מאוד ${userName}!`);
    setTimeout(() => showMainMenu(), 600);
    step = "menu";
  } else if (step === "menu") {
    handleMenuChoice(text);
  } else if (step === "register") {
    handleLessonSelection(text);
  }
}

function addBotMessage(text) {
  const msg = document.createElement("div");
  msg.classList.add("bot-message");
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addUserMessage(text) {
  const msg = document.createElement("div");
  msg.classList.add("user-message");
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showMainMenu() {
  addBotMessage("בחר פעולה:");
  addBotMessage("1️⃣ הרשמה לשיעור");
  addBotMessage("2️⃣ שאלות ותשובות על שיעורים");
  addBotMessage("3️⃣ הדרכה עם סוכן רגשי");
}

function handleMenuChoice(choice) {
  switch (choice) {
    case "1":
      addBotMessage(`שמחים שבחרת להירשם לשיעורים שלנו 🌿`);
      fetchLessons();
      break;
    case "2":
      addBotMessage(`שאל/י כל שאלה על מערכי השיעורים 📘`);
      break;
    case "3":
      addBotMessage(`נשמח לשוחח איתך על התחושות שלך 💬`);
      break;
    default:
      addBotMessage("אנא הזן מספר בין 1 ל-3 🙏");
  }
}

async function fetchLessons() {
  try {
    const res = await fetch("/api/lessons");
    const data = await res.json();
    lessons = data.lessons || [];
    if (lessons.length === 0) {
      addBotMessage("לא נמצאו שיעורים זמינים כרגע 🙏");
      return;
    }
    addBotMessage("הנה רשימת השיעורים הקרובים:");
    lessons.forEach((lesson, i) => {
      addBotMessage(`${i + 1}. ${lesson.title} 
📅 תאריך: ${lesson.date} ⏰ שעה: ${lesson.time}
👩‍🏫 מנחה: ${lesson.instructor} 📍 מקום: ${lesson.location}`);
    });
    addBotMessage("אנא הקלד מספר בין 1 ל-5 כדי להירשם לשיעור הרצוי");
    step = "register";
  } catch (err) {
    addBotMessage("שגיאה בשליפת השיעורים מהשרת ❌");
  }
}

async function handleLessonSelection(choice) {
  const index = parseInt(choice) - 1;
  if (isNaN(index) || index < 0 || index >= lessons.length) {
    addBotMessage("אנא הזן מספר תקין בין 1 ל-5 🙏");
    return;
  }

  const chosenLesson = lessons[index];
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: userName, lesson_id: chosenLesson.lesson_id })
    });
    const result = await res.json();

    if (result.status === "OK") {
      addBotMessage(`נרשמת בהצלחה לשיעור "${chosenLesson.title}" ✅`);
    } else {
      addBotMessage(result.message || "שגיאה בהרשמה ❌");
    }
  } catch (err) {
    addBotMessage("שגיאה בחיבור לשרת ❌");
  }

  addBotMessage("מה תרצה/י לעשות עכשיו?");
  showMainMenu();
  step = "menu";
}
