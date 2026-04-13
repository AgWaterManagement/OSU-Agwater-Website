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

const PRACTICE_CATEGORIES = [
  'All Farms – Vegetation',
  'All Farms – Waterways',
  'All Farms – Water Flow & Storage',
  'All Farms – Fields',
  'All Farms – Road & Ditch',
  'Crop – Plans',
  'Crop – Vegetation',
  'Crop – Tillage',
  'Livestock – Grazing',
  'Livestock – Off‑stream Watering',
  'Livestock – Waste',
];

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
 * PracticesEditor Component
 * Manages CRUD operations for agricultural practices via the /agwqplan/practices route.
 */
const PracticesEditor = ({ apiBase }) => {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPractice, setEditingPractice] = useState(null);
  const [form] = Form.useForm();

  // Fetch practices from backend
  const fetchPractices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/agwqplan/practices`);
      if (!response.ok) throw new Error('Failed to fetch practices');
      const data = await response.json();
      if (data.success && data.data) {
        setPractices(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      message.error(`Error fetching practices: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchPractices();
  }, [fetchPractices]);

  // Handle opening edit modal
  const handleEdit = (practice) => {
    setEditingPractice(practice);
    form.setFieldsValue({
      ...practice,
      tags: practice.tags || [],
      tmdls: practice.tmdls || [],
      links: practice.links || [],
    });
    setModalVisible(true);
  };

  // Handle adding new practice
  const handleAdd = () => {
    setEditingPractice(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle saving practice
  const handleSave = async (values) => {
    try {
      const payload = [
        {
          id: values.id || `P${Date.now()}`,
          title: values.title,
          category: values.category,
          helps: values.helps || [],
          ecosystemBenefits: values.ecosystemBenefits,
          costs: values.costs,
          benefits: values.benefits,
          links: values.links || [],
          tags: values.tags || [],
          tmdls: values.tmdls || [],
          complianceNotes: values.complianceNotes,
        },
      ];

      const response = await fetch(`${apiBase}/agwqplan/practices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Practice saved successfully');
        setModalVisible(false);
        form.resetFields();
        fetchPractices();
      } else {
        message.error(`Failed to save practice: ${data.error}`);
      }
    } catch (error) {
      message.error(`Error saving practice: ${error.message}`);
    }
  };

  // Handle deleting practice
  const handleDelete = (practiceId) => {
    Modal.confirm({
      title: 'Delete Practice',
      content: 'Are you sure you want to delete this practice?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`${apiBase}/agwqplan/practices`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ id: practiceId }]),
          });

          const data = await response.json();
          if (data.success) {
            message.success('Practice deleted successfully');
            fetchPractices();
          } else {
            message.error(`Failed to delete practice: ${data.error}`);
          }
        } catch (error) {
          message.error(`Error deleting practice: ${error.message}`);
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
      width: 80,
      ellipsis: true,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => <span style={{ maxWidth: 300 }}>{text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) =>
        tags && tags.map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: 'TMDLs',
      dataIndex: 'tmdls',
      key: 'tmdls',
      render: (tmdls) =>
        tmdls && tmdls.map((tmdl) => <Tag color="blue" key={tmdl}>{tmdl}</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
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
              Add Practice
            </Button>
            <Button ghost icon={<ReloadOutlined />} onClick={fetchPractices}>
              Refresh
            </Button>
          </Space>
        </div>

        <Table
          dataSource={practices}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        <Modal
          title={editingPractice ? 'Edit Practice' : 'Add Practice'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="id"
              label="Practice ID"
              rules={[{ required: true, message: 'Please enter practice ID' }]}
              hidden={!!editingPractice}
            >
              <Input placeholder="e.g., A1" disabled={!!editingPractice} />
            </Form.Item>

            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter practice title' }]}
            >
              <Input.TextArea rows={3} placeholder="Practice title" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category">
                {PRACTICE_CATEGORIES.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="helps"
              label="Helps (comma-separated)"
              tooltip="Water quality aspects this practice helps with"
            >
              <Input.TextArea
                rows={2}
                placeholder="e.g., Sediment,TSS,Nutrients"
              />
            </Form.Item>

            <Form.Item
              name="ecosystemBenefits"
              label="Ecosystem Benefits"
              rules={[{ required: true, message: 'Please enter ecosystem benefits' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="costs"
              label="Costs"
              rules={[{ required: true, message: 'Please enter costs' }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item
              name="benefits"
              label="Benefits"
              rules={[{ required: true, message: 'Please enter benefits' }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item
              name="tags"
              label="Tags (concern categories)"
              tooltip="Link to concern question categories"
            >
              <Select mode="multiple" placeholder="Select tags">
                {CONCERN_CATEGORIES.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="tmdls"
              label="TMDLs (comma-separated)"
              tooltip="Total Maximum Daily Loads this practice addresses"
            >
              <Input.TextArea rows={2} placeholder="e.g., Willamette Basin Temperature TMDL" />
            </Form.Item>

            <Form.Item
              name="complianceNotes"
              label="Compliance Notes"
            >
              <Input.TextArea rows={2} placeholder="Optional compliance information" />
            </Form.Item>

            <Form.Item label="References" tooltip="Add references as JSON array">
              <Input.TextArea
                rows={3}
                placeholder='[{"label":"OSU Ext","url":"https://..."}]'
              />
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

PracticesEditor.propTypes = {
  apiBase: PropTypes.string.isRequired,
};

export default PracticesEditor;
