import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

/**
 * GoalsEditor Component
 * Manages CRUD operations for goals via the /agwqplan/goals route.
 */
const GoalsEditor = ({ apiBase }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoals, setEditingGoals] = useState(null);
  const [form] = Form.useForm();

  // Fetch goals from backend
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/agwqplan/goals`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      if (data.success && data.data) {
        setGoals(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      message.error(`Error fetching goals: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Handle opening edit modal
  const handleEdit = (goal) => {
    setEditingGoals(goal);
    form.setFieldsValue({ goal: goal.goal || goal });
    setModalVisible(true);
  };

  // Handle adding new goal
  const handleAdd = () => {
    setEditingGoals(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle saving goal
  const handleSave = async (values) => {
    try {
      const payload = [
        {
          id: editingGoals?.id || `com-${Date.now()}`,
          goal: values.goal,
        },
      ];

      const response = await fetch(`${apiBase}/agwqplan/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Goals saved successfully');
        setModalVisible(false);
        form.resetFields();
        fetchGoals();
      } else {
        message.error(`Failed to save goal: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving goal: ${error.message}`);
    }
  };

  // Handle deleting goal
  const handleDelete = (goalId) => {
    Modal.confirm({
      title: 'Delete Goals',
      content: 'Are you sure you want to delete this goal?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`${apiBase}/agwqplan/goals`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: goalId }]),
          });

          const data = await response.json();
          if (data.success) {
            message.success('Goals deleted successfully');
            fetchGoals();
          } else {
            message.error(`Failed to delete goal: ${data.error}`);
          }
        } catch (error) {
          message.error(`Error deleting goal: ${error.message}`);
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
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Goal',
      dataIndex: 'goal',
      key: 'goal',
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
              Add Goals
            </Button>
            <Button ghost icon={<ReloadOutlined />} onClick={fetchGoals}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          dataSource={goals}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        <Modal
          title={editingGoals ? 'Edit Goals' : 'Add Goals'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="name"
              label="Goals Name"
              rules={[{ required: true, message: 'Please enter goal' }]}
            >
              <Input placeholder="Enter goal name (e.g., Wheat, Grazing)" />
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

GoalsEditor.propTypes = {
  apiBase: PropTypes.string.isRequired,
};

export default GoalsEditor;
