const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (text === "") return;

  // הצגת הודעת המשתמש
  const userDiv = document.createElement("div");
  userDiv.classList.add("user-message");
  userDiv.textContent = text;
  chatBox.appendChild(userDiv);

  // ניקוי השדה
  input.value = "";

  // תגובת מערכת (כרגע דמו)
  setTimeout(() => {
    const botDiv = document.createElement("div");
    botDiv.classList.add("bot-message");
    botDiv.textContent = "קיבלתי את ההודעה שלך, " + text + "!";
    chatBox.appendChild(botDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 700);
}
