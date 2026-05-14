/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  QRCode,
  Select,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';

const { Text, Paragraph, Title } = Typography;

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function readError(error) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  return error?.message || 'Unexpected error';
}

export default function AgWqplanAuthManager({
  apiBaseUrl = '',
  apiKey = '',
  showAdmin = true,
  onAuthenticated,
  onUserCreated,
}) {
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const [createResult, setCreateResult] = useState(null);

  const baseURL = useMemo(() => normalizeBaseUrl(apiBaseUrl), [apiBaseUrl]);

  const client = useMemo(() => {
    return axios.create({
      baseURL,
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
    });
  }, [baseURL, apiKey]);

  const submitLogin = async (values) => {
    setLoading(true);
    try {
      const response = await client.post('/agwqplan/auth/login', {
        username: values.username,
        password: values.password,
        role: values.role,
        otp_code: values.otpCode,
      });

      setLoginResult(response.data?.result || response.data);
      message.success('Logged in successfully');
      onAuthenticated?.(response.data?.result || response.data);
    } catch (error) {
      const errorMessage = readError(error);
      setLoginResult(null);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /*
  const initUsersTable = async () => {
    setLoading(true);
    try {
      const response = await client.post('/agwqplan/auth/users/init', {});
      message.success(response.data?.message || 'Users table initialized');
    } catch (error) {
      message.error(readError(error));
    } finally {
      setLoading(false);
    }
  }; */

  const createUser = async (values) => {
    setLoading(true);
    try {
      const response = await client.post('/agwqplan/auth/users', {
        username: values.username,
        email: values.email,
        role: values.role,
        password: values.password,
      });

      setCreateResult(response.data?.result || response.data);
      message.success('User created successfully');
      onUserCreated?.(response.data?.result || response.data);
    } catch (error) {
      setCreateResult(null);
      message.error(readError(error));
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (values) => {
    setLoading(true);
    try {
      const payload = values.id ? { id: values.id } : { username: values.username };
      const response = await client.delete('/agwqplan/auth/users', { data: payload });
      message.success(response.data?.message || 'User removed successfully');
    } catch (error) {
      message.error(readError(error));
    } finally {
      setLoading(false);
    }
  };

  const loginItems = [
    {
      key: 'login',
      label: 'Login',
      children: (
        <div style={{ padding: 0, maxWidth: 640 }}>
          <Form layout="vertical" onFinish={submitLogin}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Enter your username' }]}
            >
              <Input autoComplete="username" placeholder="Username" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Enter your password' }]}
            >
              <Input.Password autoComplete="current-password" placeholder="Password" />
            </Form.Item>
            <Form.Item
              name="otpCode"
              label="Authenticator Code"
              rules={[{ required: true, message: 'Enter the 6-digit code from your authenticator app' }]}
            >
              <Input inputMode="numeric" maxLength={6} placeholder="123456" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Sign In
            </Button>
          </Form>

          {loginResult && (
            <Alert
              style={{ marginTop: 16, backgroundColor: '#333' }}
              type="success"
              showIcon
              message="Authentication successful"
              description={
                <Space direction="vertical" size={0}>
                  <Text>Signed in as {loginResult?.user?.username || 'unknown user'}</Text>
                  {loginResult?.user?.role && <Text type="secondary" style={{ color: '#ccc' }}>Role: {loginResult.user.role}</Text>}
                </Space>
              }
            />
          )}
        </div>
      ),
    },
  ];

  if (showAdmin) {
    loginItems.push(
      {
        key: 'setup',
        label: 'Setup User',
        children: (

          <div style={{ maxWidth: 360, textAlign: 'center', margin: '0 auto' }}>
            <Form layout="vertical" onFinish={createUser}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Enter a username' }]}
              >
                <Input placeholder="jane.doe" />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input type="email" placeholder="jane@example.com" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
              >
                <Input.Password placeholder="Create a strong password" />
              </Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
                <Select
                  placeholder="Select role"
                  options={[
                    { label: 'ODA user', value: 'ODA user' },
                    { label: 'ODA editor', value: 'ODA editor' },
                    { label: 'admin', value: 'admin' },
                  ]}
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create User
              </Button>
            </Form>

            {createResult && (
              <Card size="small" title="Authenticator Setup" style={{ maxWidth: 640 }}>
                <Paragraph style={{ marginBottom: 8 }}>
                  Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy, or a compatible app.
                </Paragraph>
                {createResult.otpauth_uri && (
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <QRCode value={createResult.otpauth_uri} size={192} />
                    <Text code style={{ wordBreak: 'break-all', display: 'block', textAlign: 'center' }}>
                      {createResult.totp_secret}
                    </Text>
                  </Space>
                )}
              </Card>
            )}
          </div>
        ),
      },
      {
        key: 'remove',
        label: 'Remove User',
        children: (
          <Card bordered={false}>
            <Form layout="vertical" onFinish={removeUser}>
              <Form.Item name="id" label="User ID">
                <Input placeholder="Optional if username is provided" />
              </Form.Item>
              <Divider style={{ margin: '12px 0' }}>or</Divider>
              <Form.Item name="username" label="Username">
                <Input placeholder="Optional if id is provided" />
              </Form.Item>
              <Button danger htmlType="submit" loading={loading}>
                Remove User
              </Button>
            </Form>
          </Card>
        ),
      },
    );
  }

  return (
    <div style={{ padding: 4, textAlign: 'center', maxWidth: 420, margin: '0 auto' }} >
      <Title level={3} style={{ marginBottom: 0 }}>
        Ag Water Quality Plan Authentication Manager
      </Title>
      <Text type="secondary">Use the form below to log in or manage users.</Text>
      <Tabs items={loginItems} />
    </div>
  );
}
