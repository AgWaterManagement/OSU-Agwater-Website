import React, { useState, useEffect } from "react";
import { Input, Button, Spin, Typography, Card } from "antd";

import './OllamaChat.css';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const API_URL = "/api/ollama-chat"; //https://agwater.org:5556";

const OllamaChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);


  const sendMessage = async () => {
    if (input.trim() === "") return;

    const prompt = `"""${input.trim()}"""`;
    const newMessage = { role: "user", message: input };
    setMessages([...messages, newMessage, { role: "ai", message: "Loading..." }]);
    setInput("");

    try {
      const response = await fetch(`${API_URL}/LLMChat?prompt=`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let chatbotResponse = "";

        while (!done) {
          const { value, done: readDone } = await reader.read();
          done = readDone;
          chatbotResponse += decoder.decode(value, { stream: !done });
          setMessages((prevMessages) =>
            prevMessages.map((msg, idx) =>
              idx === prevMessages.length - 1
                ? { ...msg, message: chatbotResponse }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  const openNewConv = () => {
    setMessages([]);
  };

  return (
    <div className="container">
      <header className="header">
      </header>

      <main className="main">
        {loading ? (
          <div className="loading-container">
            <Spin />
          </div>
        ) : (
          <div>
            {messages.map((msg, index) => (
              <div
                className={`message-container ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
                key={index}
              >
                <div
                  className={`message ${
                    msg.role === "user" ? "user-message" : "ai-message"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="chat-footer">
        <div className="input-container">
          <Input.TextArea
            className="textarea"
            placeholder="Type your question or prompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 6 }}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            type="primary"
            onClick={sendMessage}
          >
            Send
          </Button>
        </div>
      </footer>
      <Button onClick={openNewConv} 
        type="text" 
        size="small"
      >
        Start a New Conversation
      </Button>
    </div>
  );
};

export default OllamaChat;
