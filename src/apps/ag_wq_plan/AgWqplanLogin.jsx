import { useMemo, useState } from "react";
import { Alert, Button, Card, Divider, Form, Input, Space, Typography, message } from "antd";

import { secrets } from "../../secrets";

const { Title, Text } = Typography;

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return "";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid JSON response" };
  }
}

export default function AgWqplanLogin({
  onLoginSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });

  const apiBaseUrl = "https://agwater.org:5556" // Adjust if your API is hosted elsewhere
  const apiKey = secrets.agwater_api_key; // Optional: if your API requires an API key for login

  const withHeaders = (includeJson = true) => {
    const headers = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (apiKey) headers["X-API-Key"] = apiKey;
    return headers;
  };

  const post = async (path, payload) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: withHeaders(true),
      body: JSON.stringify(payload || {}),
    });
    return { response, body: await parseJsonResponse(response) };
  };



  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const { response, body } = await post("/agwqplan/auth/login", {
        username: values.username,
        password: values.password,
        otp_code: values.otpCode,
      });

      if (!response.ok || !body.success) {
        throw new Error(body.error || "Login failed");
      }

      const user = body?.result?.user || null;
      setAuthState({ isAuthenticated: true, user });
      message.success("Authenticated successfully");
      if (onLoginSuccess) onLoginSuccess(body.result);
    } catch (err) {
      message.error(err.message || "Authentication failed");
      setAuthState({ isAuthenticated: false, user: null });
    } finally {
      setLoading(false);
    }
  };

  return (<>
  <div style={{ padding: 4, textAlign: 'center' }} >
    <Title level={4}>Sign In to the Ag Water Quality Planner</Title>
    <Text style={{width: '100%', maxWidth: 600, display: 'inline-block'}}>
      Use this interface to log in to the Ag WQPlan application. If you do not have an account, please contact your administrator.
    </Text>
    <br/>
    <br/>

      <Space direction="vertical" size="large" style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <Form layout="vertical" onFinish={handleLogin}>
        <Form.Item name="username" label="Username" rules={[{ required: true }]}>
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="otpCode"
          label="One-Time Code"
          rules={[{ required: true, message: "Enter your 6-digit OTP" }]}
        >
          <Input maxLength={6} placeholder="123456" />
        </Form.Item>
        <Button htmlType="submit" type="primary" loading={loading} style={{ marginRight: 8 }}>
          Sign In
        </Button>
        <Button ghost type="primary" onClick={() => {}} style={{ marginLeft: 8 }}>
          Cancel
        </Button>
      </Form>

      {authState.isAuthenticated && (
        <Alert
          type="success"
          showIcon
          message="Authenticated"
          description={`Logged in as ${authState.user?.username || "unknown"}`}
        />
      )}
      </Space>
      </div>
  </>
  );
}
