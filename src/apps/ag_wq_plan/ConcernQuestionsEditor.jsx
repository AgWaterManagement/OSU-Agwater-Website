import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const CONCERN_CATEGORIES = [
  'Streamside vegetation',
  'Cropland erosion',
  'Livestock management',
  'Manure management',
  'Irrigation',
  'Nutrients',
  'TMDL',
];

/**
 * ConcernQuestionsEditor Component
 * Manages CRUD operations for concern questions via the /agwqplan/concernQuestions route.
 */
const ConcernQuestionsEditor = ({ apiBase }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();

  // Fetch concern questions from backend
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/agwqplan/concernQuestions`);
      if (!response.ok) throw new Error('Failed to fetch concern questions');
      const data = await response.json();
      if (data.success && data.data) {
        setQuestions(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      message.error(`Error fetching concern questions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle opening edit modal
  const handleEdit = (question) => {
    setEditingQuestion(question);
    form.setFieldsValue(question);
    setModalVisible(true);
  };

  // Handle adding new question
  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle saving question
  const handleSave = async (values) => {
    try {
      const payload = [
        {
          id: values.id || `q-${Date.now()}`,
          category: values.category,
          text: values.text,
        },
      ];

      const response = await fetch(`${apiBase}/agwqplan/concernQuestions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Concern question saved successfully');
        setModalVisible(false);
        form.resetFields();
        fetchQuestions();
      } else {
        message.error(`Failed to save concern question: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving concern question: ${error.message}`);
    }
  };

  // Handle deleting question
  const handleDelete = (questionId) => {
    Modal.confirm({
      title: 'Delete Concern Question',
      content: 'Are you sure you want to delete this concern question?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`${apiBase}/agwqplan/concernQuestions`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: questionId }]),
          });

          const data = await response.json();
          if (data.success) {
            message.success('Concern question deleted successfully');
            fetchQuestions();
          } else {
            message.error(`Failed to delete concern question: ${data.error}`);
          }
        } catch (error) {
          message.error(`Error deleting concern question: ${error.message}`);
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Concern',
      dataIndex: 'concern',
      key: 'concern',
      width: 200,
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Concern Question
            </Button>
            <Button ghost icon={<ReloadOutlined />} onClick={fetchQuestions}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          dataSource={questions}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        <Modal
          title={editingQuestion ? 'Edit Concern Question' : 'Add Concern Question'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="id"
              label="Question ID"
              rules={[{ required: true, message: 'Please enter question ID' }]}
              hidden={!!editingQuestion}
            >
              <Input placeholder="e.g., q-stream-bare-soil" disabled={!!editingQuestion} />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select concern category">
                {CONCERN_CATEGORIES.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="text"
              label="Question Text"
              rules={[{ required: true, message: 'Please enter the question text' }]}
            >
              <Input.TextArea rows={3} placeholder="Enter the concern question" />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

ConcernQuestionsEditor.propTypes = {
  apiBase: PropTypes.string.isRequired,
};

export default ConcernQuestionsEditor;
