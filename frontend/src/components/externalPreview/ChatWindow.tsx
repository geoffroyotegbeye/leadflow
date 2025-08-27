import { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);

  const handleSend = (message: string) => {
    // Ajout du message utilisateur
    setMessages((prev) => [...prev, { sender: "user", text: message }]);

    // Réponse automatique du bot
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Je suis un bot 🤖, tu as dit : " + message },
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full max-w-md h-[600px] mx-auto mt-10 border rounded-2xl shadow-lg bg-white">
      <ChatHeader />
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
