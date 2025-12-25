import { createContext, useState } from "react";

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  // 🟦 MAIN CHAT
  const [mainMessages, setMainMessages] = useState([]);
  const [mainInput, setMainInput] = useState("");
  const [step, setStep] = useState("greet");
const [lessons, setLessons] = useState([]);

  // 🟨 FAQ CHAT  ← זה התיקון הקריטי
  const [faqMessages, setFaqMessages] = useState([]);
  const [faqInput, setFaqInput] = useState("");
  const [faqMode, setFaqMode] = useState("choose");
  const [faqType, setFaqType] = useState(null);
  const [faqSelectedLesson, setFaqSelectedLesson] = useState(null);

  // 🧭 NAVIGATION
  const [screen, setScreen] = useState("main");

  // 👤 USER
  const [userName, setUserName] = useState("");

  return (
    <ChatContext.Provider
      value={{
        // main
        mainMessages,
        setMainMessages,
        mainInput,
        setMainInput,
        step,
        setStep,
lessons,
setLessons,
        // faq
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

        // navigation
        screen,
        setScreen,

        // user
        userName,
        setUserName,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
