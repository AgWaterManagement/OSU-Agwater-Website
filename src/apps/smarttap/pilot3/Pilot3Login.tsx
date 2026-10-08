import { useState } from "react";
import { Button, Form, Input, Select, Space, Typography, message } from "antd";

import { pilot3Auth, type Pilot3User } from "./auth.ts";

const { Title, Text, Paragraph } = Typography;

type LoginFormValues = {
  username: string;
  password: string;
  totpCode: string;
};

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferences: string[];
};

type Pilot3LoginProps = {
  onLoginSuccess?: (user: Pilot3User) => void;
  showCancel?: boolean;
  onCancel?: () => void;
};

export default function Pilot3Login({ onLoginSuccess, showCancel = false, onCancel }: Pilot3LoginProps) {
  const [loading, setLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const body = await pilot3Auth.login({
        username: values.username,
        password: values.password,
        totp_code: values.totpCode,
      });
      message.success("Authenticated successfully");
      onLoginSuccess?.(body.user);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const body = await pilot3Auth.register({
        username: values.username,
        email: values.email,
        password: values.password,
        preferences: values.preferences ?? [],
      });
      message.success((body.message as string) || "Account registered successfully. You can sign in now.");
      setShowRegisterForm(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 4, textAlign: "center" }}>
      <Title level={4}>Sign In to SmartTap Pilot 3</Title>
      <Text style={{ width: "100%", maxWidth: 600, display: "inline-block" }}>
        Log in to submit and review hydrology research digest runs.
      </Text>
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
              name="totpCode"
              label="One-Time Code"
              rules={[{ required: true, message: "Enter your 6-digit authenticator code" }]}
            >
              <Input maxLength={6} placeholder="123456" />
            </Form.Item>
            <Button htmlType="submit" type="primary" loading={loading} style={{ marginRight: 8 }}>
              Sign In
            </Button>
            {showCancel && (
              <Button ghost type="primary" onClick={onCancel} style={{ marginLeft: 8 }}>
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
              name="preferences"
              label="Research interests"
              tooltip="Keywords used to personalize digest runs"
            >
              <Select mode="tags" tokenSeparators={[","]} placeholder="e.g. irrigation, groundwater, drought" />
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
  );
}
