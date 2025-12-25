import { useContext } from "react";
import { ChatContext } from "./contexts/ChatContext";
import Chat from "./components/Chat";
import FAQChat from "./components/FAQChat";

function App() {
  const { screen } = useContext(ChatContext);
  return screen === "faq" ? <FAQChat /> : <Chat />;
}

export default App;
