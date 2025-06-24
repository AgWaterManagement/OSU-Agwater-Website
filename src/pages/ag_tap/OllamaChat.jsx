import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Spin, Typography, Card } from "antd";

import './OllamaChat.css';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const API_URL = "https://agwater.org:5556/LLMChat";

const OllamaChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  async function processUserQuery(mssgs) {
    try {
      const response = await fetch(`${API_URL}/LLMChat/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "llama3.2",
          messages: mssgs,
          stream: false 
        })
      });

      // Check if the response is OK
      if (!response.ok) {
        setError("Error fetching response from the server");  
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();  // Correctly parse JSON
      const combinedResponse = data.response || "Please try again"; // Ensure a fallback if empty

      // Update the message UI progressively with each chunk
      setMessages((messages) => [
        ...messages,
          {
            content: combinedResponse,
            role: "assistant",
          }
      ]);
    } catch (error) {
      setError("Uable to fetch response. Please try again later.");  
      console.error("Error fetching response:", error);
      // test
      setMessages((messages) => [...messages,
            {content: "Test - message from ollama", role: "assistant"}
      ]);
      console.log(messages);
    } finally {
      setLoading(false);
    }
  }
  
  const sendMessage = async () => {
    setError(null); // Clear previous errors

    if (input.trim() === "") return;

    const newMessage = {
        content: input.trim(),
        role: 'user',
    };

    try {
        setMessages((messages) => [...messages, newMessage]);
        console.log(messages)
        setInput("");
        setLoading(true);
        await processUserQuery(messages);
    } catch (error) {
      setError(error.message);  
      console.error('Error sending message:', error);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const openNewConv = () => {
    setMessages([]); // reset messages
    setError(null); // clear previous errors
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
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
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