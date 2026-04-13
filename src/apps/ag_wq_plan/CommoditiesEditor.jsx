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
 * CommoditiesEditor Component
 * Manages CRUD operations for commodities via the /agwqplan/commodities route.
 */
const CommoditiesEditor = ({ apiBase }) => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState(null);
  const [form] = Form.useForm();

  // Fetch commodities from backend
  const fetchCommodities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/agwqplan/commodities`);
      if (!response.ok) throw new Error('Failed to fetch commodities');
      const data = await response.json();
      if (data.success && data.data) {
        const commoditiesArray = Array.isArray(data.data) ? data.data : [];
        // Normalize to array of objects with id and name
        const normalized = commoditiesArray.map((com) => {
          if (typeof com === 'object' && com !== null && !Array.isArray(com)) {
            return { id: Object.keys(com)[0], name: Object.values(com)[0] };
          }
          return com;
        });
        setCommodities(normalized);
      }
    } catch (error) {
      message.error(`Error fetching commodities: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchCommodities();
  }, [fetchCommodities]);

  // Handle opening edit modal
  const handleEdit = (commodity) => {
    setEditingCommodity(commodity);
    form.setFieldsValue({ name: commodity.name || commodity });
    setModalVisible(true);
  };

  // Handle adding new commodity
  const handleAdd = () => {
    setEditingCommodity(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle saving commodity
  const handleSave = async (values) => {
    try {
      const payload = [
        {
          id: editingCommodity?.id || `com-${Date.now()}`,
          name: values.name,
        },
      ];

      const response = await fetch(`${apiBase}/agwqplan/commodities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Commodity saved successfully');
        setModalVisible(false);
        form.resetFields();
        fetchCommodities();
      } else {
        message.error(`Failed to save commodity: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving commodity: ${error.message}`);
    }
  };

  // Handle deleting commodity
  const handleDelete = (commodityId) => {
    Modal.confirm({
      title: 'Delete Commodity',
      content: 'Are you sure you want to delete this commodity?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`${apiBase}/agwqplan/commodities`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: commodityId }]),
          });

          const data = await response.json();
          if (data.success) {
            message.success('Commodity deleted successfully');
            fetchCommodities();
          } else {
            message.error(`Failed to delete commodity: ${data.error}`);
          }
        } catch (error) {
          message.error(`Error deleting commodity: ${error.message}`);
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
              Add Commodity
            </Button>
            <Button ghost icon={<ReloadOutlined />} onClick={fetchCommodities}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          dataSource={commodities}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        <Modal
          title={editingCommodity ? 'Edit Commodity' : 'Add Commodity'}
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
              label="Commodity Name"
              rules={[{ required: true, message: 'Please enter commodity name' }]}
            >
              <Input placeholder="Enter commodity name (e.g., Wheat, Grazing)" />
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

CommoditiesEditor.propTypes = {
  apiBase: PropTypes.string.isRequired,
};

export default CommoditiesEditor;
