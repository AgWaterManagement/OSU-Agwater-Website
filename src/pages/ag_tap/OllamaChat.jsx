import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Spin, Typography, Card } from "antd";

import './OllamaChat.css';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const API_URL = "https://agwater.org:11434";

const OllamaChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function processUserQuery(prompt) {
    try {
      const response = await fetch(`${API_URL}/LLMChat/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt })
      });

      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();  // Correctly parse JSON
      const combinedResponse = data.response || "Please try again"; // Ensure a fallback if empty

      // Update the message UI progressively with each chunk
      setMessages((messages) => [
        ...messages,
          {
            id: Date.now(),
            message: combinedResponse,
            role: 'ai',
          }
      ]);
    } catch (error) {
      console.error("Error fetching Falcon response:", error);
      setMessages((messages) => [
        ...messages,
          {
            id: Date.now(),
            message: "Error: Unable to fetch response.",
            role: 'ai',
          }
      ]);
    } finally {
      setLoading(false);
    }
  }
  
  const sendMessage = async () => {
    if (input.trim() === "") return;

    const newMessage = {
        id: Date.now(),
        message: input.trim(),
        role: 'user',
    };

    try {
        setMessages((messages) => [...messages, newMessage]);
        setInput("");
        setLoading(true);
        await processUserQuery(input);
    } catch (error) {
        console.error('Error sending message:', error);
    }

    if (inputRef.current) {
      inputRef.current.focus();
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
            {messages.map((msg) => (
              <div
                className={`message-container ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
                key={msg.id}
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
          <TextArea
            ref={inputRef}
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
          <Button type="primary" onClick={sendMessage}>
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