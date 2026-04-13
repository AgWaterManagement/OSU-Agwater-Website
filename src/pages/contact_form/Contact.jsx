import { Form, Input, Button, Typography, Grid, Select, notification } from "antd";
import { useState } from "react";
import PropTypes from "prop-types";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const CONTACT_EMAIL = "ag-water@oregonstate.edu";

export default function Contact({ onSubmit }) {
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const containerStyle = {
    maxWidth: 700,
    margin: "0 auto",
    padding: isMobile ? "24px 16px" : "40px 24px",
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch("https://agwater.org:5556/contact", {
        method: "POST",
        headers: {
          "X-API-Key": "survey-web-app",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSubmit) onSubmit(values);
      } else {
        throw new Error("Server error");
      }
    } catch {
      notification.error({
        message: "Submission failed",
        description: (
          <>
            Your message could not be sent automatically. Please email us
            directly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ),
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ ...containerStyle, textAlign: "center", paddingTop: 60 }}>
        <Title level={2}>Message Sent!</Title>
        <Text style={{ fontSize: 17, display: "block", marginBottom: 24 }}>
          Thank you for reaching out. We will get back to you as soon as
          possible.
        </Text>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            form.resetFields();
            setSubmitted(false);
          }}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Title level={2} style={{ marginBottom: 8 }}>
        Contact Us
      </Title>
      <Text style={{ display: "block", marginBottom: 24 }}>
        Have a question or comment? Fill out the form below.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        scrollToFirstError
        requiredMark
      >
        {/* Name */}
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input placeholder="Your full name" />
        </Form.Item>

        {/* Email */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="name@example.com" />
        </Form.Item>

        {/* Affiliation */}
        <Form.Item label="Affiliation / Organization" name="affiliation">
          <Input placeholder="Your organization or institution (optional)" />
        </Form.Item>

        {/* Topic */}
        <Form.Item
          label="Topic"
          name="topic"
          rules={[{ required: true, message: "Please select a topic" }]}
        >
          <Select placeholder="Select a topic">
            <Select.Option value="General Inquiry">
              General Inquiry
            </Select.Option>
            <Select.Option value="Drought Tools">Drought Tools</Select.Option>
            <Select.Option value="Irrigation Scheduling">
              Irrigation Scheduling
            </Select.Option>
            <Select.Option value="Water Quality">Water Quality</Select.Option>
            <Select.Option value="AgWaterTAP Program">
              AgWaterTAP Program
            </Select.Option>
            <Select.Option value="Survey Feedback">
              Survey Feedback
            </Select.Option>
            <Select.Option value="Technical Issue">
              Technical Issue
            </Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </Form.Item>

        {/* Message */}
        <Form.Item
          label="Message"
          name="message"
          rules={[{ required: true, message: "Please enter your message" }]}
        >
          <TextArea
            rows={6}
            placeholder="Write your message here..."
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block={isMobile}
          >
            Send Message
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

Contact.propTypes = {
  onSubmit: PropTypes.func,
};
