import { useState, useEffect, useRef } from "react";
import { Input, Button, Spin, Typography, Card, Select } from "antd";

import Markdown from 'react-markdown'
import './OllamaChat.css';


const { TextArea } = Input;
//const { Title, Paragraph } = Typography;
const { Option } = Select;

const CHAT_API_URL = "https://agwater.org:5556/LLMChat";
const MODELS_API_URL = "https://agwater.org:5556/LLMModels";

const OllamaChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");

  async function processUserQuery(mssgs) {
    try {
      console.log("mssgs: ", JSON.stringify(mssgs));
      const encodedJSON = encodeURIComponent(JSON.stringify({ mssgs }));
      let modelParam = '';
      if (selectedModel) {
        modelParam = `&model=${selectedModel}`;
      }
      const url = `${CHAT_API_URL}?query=${encodedJSON}${modelParam}&stream=0`;
      console.log(url);
      const response = await fetch(url, { method: "GET" });
      //const response = testStreamingResponse(); // Use the test function for simulated streaming response
      console.log("response: ", response); // debug

      // Check if the response is OK
      if (!response.ok) {
        console.log("response: ", response);
        setError("Error fetching response from the server");
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResponse += chunk;

        // Update the message UI progressively with each chunk
        setMessages((messages) => [
          ...messages,
          {
            content: chunk,
            role: "assistant",
          },
        ]);
      }

      // Ensure a fallback if the response is empty
      if (!accumulatedResponse) {
        setMessages((messages) => [
          ...messages,
          {
            content: "Please try again",
            role: "assistant",
          },
        ]);
      }
    } catch (error) {
      setError("Unable to fetch response. Please try again later.");
      console.error("Error fetching response:", error);
    } finally {
      setLoading(false);
      console.log("messages after processing: ", messages); // debug
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
        console.log(input.trim(), messages); // debug
        setInput("");
        setLoading(true);
        await processUserQuery(input.trim());
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

  // Test function to mimic a streaming response from the API
  const mockStreamingResponse = async (messages, setMessages) => {
    const simulatedChunks = [
      "This is the first chunk of the response.",
      "Here comes the second chunk.",
      "Finally, this is the last chunk."
    ];

    for (const chunk of simulatedChunks) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      setMessages((prevMessages) => [
        ...prevMessages,
        { content: chunk, role: "assistant" }
      ]);
    }
  };

  // Example usage of the test function
  const testStreamingResponse = () => {
    //setMessages([]); // Clear existing messages
    mockStreamingResponse(messages, setMessages);
  };

  const formatResponseContent = (content) => {

    let jsonContent = JSON.parse(content);
    let contentStr = jsonContent.response.llm_response.replaceAll("\n","\r\n") || "No response available";

    return (<Markdown>{contentStr}</Markdown>);
  }

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
                  msg.role === "user" ? "justify-start" : "justify-end"
                }`}
                key={index}
              >
                <div
                  className={`message ${
                    msg.role === "user" ? "user-message" : "ai-message"
                  }`}
                >
                  
                  {msg.role==="user"? msg.content : formatResponseContent(msg.content) }
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
      <br/>
        <div>
          <Select
          allowClear
          placeholder="(Optional) Select a model ..."
          value={selectedModel}
          onChange={(value) => setSelectedModel(value)}
          style={{ width: 300 }}
        >
          <Option value="llama3.2">llama3.2</Option>
          <Option value="model2">Model 2</Option>
          <Option value="model3">Model 3</Option>
        </Select>
      </div>



      <Button onClick={openNewConv} 
        type="text" 
        size="small"
      >
        Start a New Conversation
      </Button>
      <Button onClick={testStreamingResponse} type="text" size="small">
        Test Streaming Response
      </Button>
    </div>
  );
};

export default OllamaChat;