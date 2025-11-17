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
    setTimeout(() => showMainMenu(), 500);
    step = "menu";
  }

  else if (step === "menu") {
    handleMenuChoice(text);
  }

  else if (step === "register") {
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
  addBotMessage("2️⃣ שאלות על שיעורים");
  addBotMessage("3️⃣ שיחה עם סוכן רגשי");
}

function handleMenuChoice(choice) {
  switch (choice) {
    case "1":
      addBotMessage("מציג שיעורים...");
      fetchLessons();
      break;

    case "2":
      addBotMessage("שאל אותי שאלה על שיעורים.");
      break;

    case "3":
      addBotMessage("איך את/ה מרגיש/ה היום?");
      break;

    default:
      addBotMessage("אנא הזן מספר בין 1 ל-3 🙏");
  }
}

async function fetchLessons() {
  try {
    const res = await fetch("/api/lessons");
    const data = await res.json();

    lessons = data.lessons;

    addBotMessage("🔥 הנה השיעורים הזמינים:");

    lessons.forEach((lesson, index) => {
      const dateObj = new Date(lesson.date);
      const date = dateObj.toLocaleDateString("he-IL");
      const time = dateObj.toLocaleTimeString("he-IL", {hour: '2-digit', minute:'2-digit'});

      addBotMessage(
        `${index + 1}. ${lesson.title}
📅 ${date} ⏰ ${time}
👩‍🏫 מנחה: ${lesson.instructor}`
      );
    });

    addBotMessage("הקלד מספר כדי לבחור שיעור:");
    step = "register";

  } catch (err) {
    addBotMessage("❌ שגיאה בשליפת השיעורים מהשרת");
  }
}

async function handleLessonSelection(choice) {
  const index = parseInt(choice) - 1;

  if (isNaN(index) || index < 0 || index >= lessons.length) {
    addBotMessage("מספר לא תקין, נסה שוב 🙏");
    return;
  }

  const selected = lessons[index];

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name: userName, lesson_id: selected.lesson_id })
    });

    const result = await res.json();

    if (result.status === "OK") {
      addBotMessage(`🎉 נרשמת בהצלחה לשיעור "${selected.title}"!`);
    } else {
      addBotMessage("❌ שגיאה בהרשמה");
    }
  } catch {
    addBotMessage("❌ בעיית תקשורת עם השרת");
  }

  showMainMenu();
  step = "menu";
}
