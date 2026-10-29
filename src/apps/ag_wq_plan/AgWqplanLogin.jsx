import { useMemo, useState } from "react";
import { Alert, Button, Form, Input, Row, Col, QRCode, Select, Space, Typography, message } from "antd";
import PropTypes from "prop-types";

import { secrets } from "../../secrets";
const { Title, Paragraph } = Typography;

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

export default function AgWqplanLogin({ onLoginSuccess, showCancel = true , role}) {
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  const apiBaseUrl = useMemo(() => normalizeBaseUrl("https://agwater.org:5556"), []);
  const apiKey = secrets.agwater_api_key;

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

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const { response, body } = await post("/agwqplan/auth/users", {
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
      });

      if (!response.ok || !body.success) {
        throw new Error(body.error || body.message || "Registration failed");
      }

      setRegistrationResult(body.result || body);
      message.success(body.message || "Account registered successfully. You can sign in now.");
      setShowRegisterForm(false);
    } catch (err) {
      message.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (<>
    {authState.isAuthenticated === false && (
      <>
        <div style={{ padding: 4, textAlign: 'center' }} >
          <Title level={4}>Sign In to the Ag Water Quality Planner</Title>
          <Paragraph style={{ width: '100%'}}>
            Log in to the Ag Water Quality Planner below.  
          </Paragraph>
          {registrationResult?.otpauth_uri && (
            <Row>
              <Col span={12}>
                <Paragraph style={{ width: '100%' }}>
                  Scan this QR code with your Authenticator app to set up two-factor authentication (2FA) for your account. After scanning, your app will generate the one-time code used when signing in.
                </Paragraph>
              </Col>
              <Col span={12}>
                <QRCode value={registrationResult.otpauth_uri} size={128} />
              </Col>
            </Row>
          )}
          <Paragraph style={{ width: '100%'}}>
            You will need an Authenticator app (like Google Authenticator or Microsoft Authenticator, 
            available in your app store) to generate a one-time code for signing in.
          </Paragraph>
          {!showRegisterForm && (
            <Paragraph style={{ width: '100%'}}>
              If you do not have an account, you can create one using the &quot;Register here&quot; link below.  If you do not want to create an account, you can continue as a guest, but you will not be able to save your plan.

              {/*<Link onClick={() => setShowRegisterForm(true)}>create one</Link>. */}
            </Paragraph>
          )}
          <br />
          <br />

          <Space direction="vertical" size="large" style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {!showRegisterForm ? (
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
                {showCancel && (
                  <Button ghost type="primary" onClick={() => { }} style={{ marginLeft: 8 }}>
                    Cancel
                  </Button>
                )}

                <Paragraph style={{ marginTop: 16 }}>
                  Don&apos;t have an account?{" "}
                  <Button type="link" onClick={() => setShowRegisterForm(true)}>
                    Register here
                  </Button>
                </Paragraph>
              </Form>
            ) : (
              <Form layout="vertical" onFinish={handleRegister} style={{ width: "100%", maxWidth: 420 }}>
                <Form.Item name="username" label="Username" rules={[{ required: true, message: "Enter a username" }]}>
                  <Input autoComplete="username" placeholder="Choose a username" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Enter an email address" },
                    { type: "email", message: "Enter a valid email address" },
                  ]}
                >
                  <Input autoComplete="email" placeholder="you@example.com" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, min: 8, message: "Password must be at least 8 characters" }]}
                >
                  <Input.Password autoComplete="new-password" placeholder="Create a password" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("Passwords do not match"));
                      },
                    }),
                  ]}
                >
                  <Input.Password autoComplete="new-password" placeholder="Confirm your password" />
                </Form.Item>
                <Form.Item
                  name="role"
                  label="User Role"
                  initialValue={role}
                  rules={[{ required: true, message: "Select a user role" }]}
                >
                  <Select
                    placeholder="Select a user role"
                    options={[
                      { label: "Landowner", value: "Landowner" },
                      { label: "Resource Conservationist", value: "Resource Conservationist" },
                      { label: "ODA Water Quality Specialist", value: "ODA Water Quality Specialist" },
                    ]}
                  />
                </Form.Item>
                
                <Button htmlType="submit" type="primary" loading={loading} style={{ marginRight: 8 }}>
                  Create Account
                </Button>
                <Button type="link" onClick={() => setShowRegisterForm(false)}>
                  Back to sign in
                </Button>
              </Form>
            )}
          </Space>
        </div>
      </>
    )}

    {authState.isAuthenticated && (
      <Alert
        type="info"
        showIcon
        message="Authenticated"
        description={`Logged in as ${authState.user?.username || "unknown"}`}
      />
    )}
  </>);
}

AgWqplanLogin.propTypes = {
  onLoginSuccess: PropTypes.func,
  showCancel: PropTypes.bool,
  role: PropTypes.string,
};