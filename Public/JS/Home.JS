const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let step = "greet";
let userName = "";

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
    setTimeout(() => showMainMenu(), 800);
    step = "menu";
  } else if (step === "menu") {
    handleMenuChoice(text);
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
      addBotMessage(`מצוין ${userName}, בוא נרשום אותך לשיעור 🧘‍♀️`);
      // כאן בהמשך יתווסף שלב של שליפת שיעורים מה-DB
      break;
    case "2":
      addBotMessage(`נהדר ${userName}, אתה יכול לשאול אותי כל שאלה על מערכי השיעורים 📘`);
      break;
    case "3":
      addBotMessage(`תודה ${userName}, נתחיל בשיחה עם הסוכן הרגשי 💬`);
      break;
    default:
      addBotMessage("אנא הזן מספר בין 1 ל-3 🙏");
  }
}
