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
 * ConcernsEditor Component
 * Manages CRUD operations for concerns via the /agwqplan/concerns route.
 */
const ConcernsEditor = ({ apiBase }) => {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConcern, setEditingConcern] = useState(null);
  const [form] = Form.useForm();

  // Fetch concerns from backend
  const fetchConcerns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/agwqplan/concerns`);
      if (!response.ok) throw new Error('Failed to fetch concerns');
      const data = await response.json();
      if (data.success && data.data) {
        const concernsArray = Array.isArray(data.data) ? data.data : [];
        // Normalize to array of objects with id and name
        const normalized = concernsArray.map((concern) => {
          if (typeof concern === 'object' && concern !== null && !Array.isArray(concern)) {
            return { id: concern.id, name: concern.concern };
          }
          return concern;
        });
        setConcerns(normalized);
      }
    } catch (error) {
      message.error(`Error fetching concerns: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  // Handle opening edit modal
  const handleEdit = (concern) => {
    setEditingConcern(concern);
    form.setFieldsValue({ name: concern.name || concern });
    setModalVisible(true);
  };

  // Handle adding new concern
  const handleAdd = () => {
    setEditingConcern(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle saving concern
  const handleSave = async (values) => {
    try {
      const payload = [
        {
          id: editingConcern?.id || `con-${Date.now()}`,
          name: values.name,
        },
      ];

      const response = await fetch(`${apiBase}/agwqplan/concerns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Concern saved successfully');
        setModalVisible(false);
        form.resetFields();
        fetchConcerns();
      } else {
        message.error(`Failed to save concern: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving concern: ${error.message}`);
    }
  };

  // Handle deleting concern
  const handleDelete = (concernId) => {
    Modal.confirm({
      title: 'Delete Concern',
      content: 'Are you sure you want to delete this concern?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`${apiBase}/agwqplan/concerns`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: concernId }]),
          });

          const data = await response.json();
          if (data.success) {
            message.success('Concern deleted successfully');
            fetchConcerns();
          } else {
            message.error(`Failed to delete concern: ${data.error}`);
          }
        } catch (error) {
          message.error(`Error deleting concern: ${error.message}`);
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
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
              Add Concern
            </Button>
            <Button ghost icon={<ReloadOutlined />} onClick={fetchConcerns}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          dataSource={concerns}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        <Modal
          title={editingConcern ? 'Edit Concern' : 'Add Concern'}
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
              label="Concern Name"
              rules={[{ required: true, message: 'Please enter concern name' }]}
            >
              <Input placeholder="Enter concern name" />
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

ConcernsEditor.propTypes = {
  apiBase: PropTypes.string.isRequired,
};

export default ConcernsEditor;
