import React, { useState } from "react";
import { Input, Button, Spin, Typography, Card } from "antd";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const API_URL = "/api/ollama-chat"; // Adjust this to your backend endpoint

const OllamaChat = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResponse(data.response || "No response.");
    } catch (err) {
      setResponse("Error contacting backend.");
    }
    setLoading(false);
  };

  return (
    <Card style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Title level={3}>Ollama Chat</Title>
      <Paragraph>Enter your prompt below to interact with the Ollama LLM backend.</Paragraph>
      <TextArea
        rows={4}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Type your question or prompt..."
        disabled={loading}
      />
      <Button
        type="primary"
        onClick={handleSend}
        loading={loading}
        style={{ marginTop: 16 }}
      >
        Send
      </Button>
      <div style={{ marginTop: 24, minHeight: 80 }}>
        {loading ? <Spin /> : response && (
          <Card type="inner" title="Response">
            <Paragraph>{response}</Paragraph>
          </Card>
        )}
      </div>
    </Card>
  );
};

export default OllamaChat;
