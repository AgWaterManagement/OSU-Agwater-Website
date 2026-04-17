import React, { useState } from 'react';
import {
    Card,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Switch,
    Button,
    Space,
    Alert,
    Divider,
    Row,
    Col,
    Typography,
    Table,
    Modal,
    Select,
    message,
    Popconfirm,
    Tabs,
    Tag
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    ExperimentOutlined,
    EnvironmentOutlined,
    RadarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { secrets } from '../../secrets';

const { TextArea } = Input;
const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;


const NEW_EXPERIMENT_URL = 'https://agwater.org:5556/sensor/new_experiment';

const NewExperiment = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [beds, setBeds] = useState([]);
    const [bedModalVisible, setBedModalVisible] = useState(false);
    const [sensorModalVisible, setSensorModalVisible] = useState(false);
    const [editingBed, setEditingBed] = useState(null);
    const [editingSensor, setEditingSensor] = useState(null);
    const [selectedBedIndex, setSelectedBedIndex] = useState(null);
    const [bedForm] = Form.useForm();
    const [sensorForm] = Form.useForm();
    const [isNewSensor, setIsNewSensor] = useState(false);
    const [irrigProfileModalVisible, setIrrigProfileModalVisible] = useState(false);
    const [editingBedForProfile, setEditingBedForProfile] = useState(null);
    const [irrigProfileForm] = Form.useForm();

    // Soil type options (now using IDs)
    // IMPORTANT: These IDs must match the backend expectations of the existing soil_type database table.
    // Thus, these should not be changed unless the backend has been updated.
    const soilTypes = [
        { id: 1, name: 'Clay' },
        { id: 2, name: 'Sandy' },
        { id: 3, name: 'Loam' },
        { id: 4, name: 'Sandy Loam' },
        { id: 5, name: 'Clay Loam' },
        { id: 6, name: 'Silt' },
        { id: 7, name: 'Silt Loam' },
        { id: 8, name: 'Sandy Clay' },
        { id: 9, name: 'Silty Clay' },
        { id: 10, name: 'Sandy Clay Loam' }
    ];

    // Bed index options (0-7)
    const bedIndexes = [0, 1, 2, 3, 4, 5, 6, 7];

    // Irrigation mode options
    const irrigationModes = ['Manual', 'Automatic', 'Scheduled', 'Sensor-based'];

    // Handle main form submission
    const handleSubmit = async (values) => {
        if (beds.length === 0) {
            message.error('Please add at least one bed to the experiment');
            return;
        }

        // Check if all beds have at least one sensor
        const bedsWithoutSensors = beds.filter(bed => !bed.sensor_configurations || bed.sensor_configurations.length === 0);
        if (bedsWithoutSensors.length > 0) {
            message.error(`Please add at least one sensor to each bed. Beds missing sensors: ${bedsWithoutSensors.map(b => `Bed ${b.bed_index}`).join(', ')}`);
            return;
        }

        setLoading(true);
        
        try {
            const experimentData = {
                name: values.name,
                description: values.description,
                start_date: values.start_date.toISOString(),
                end_date: values.end_date.toISOString(),
                active: values.active || false,
                poll_interval: values.poll_interval || 600,
                bed_configurations: beds.map(bed => ({
                    bed_index: bed.bed_index,
                    soil_type: bed.soil_type,
                    irrig_mode: bed.irrig_mode,
                    irrig_rate: bed.irrig_rate,
                    irrig_total: bed.irrig_total,
                    // irrig_start: bed.irrig_start.toISOString(),
                    // irrig_stop: bed.irrig_stop.toISOString(),
                    irrig_profile: bed.irrig_profile || null,
                    sensor_configurations: bed.sensor_configurations || []
                }))
            };

            const response = await axios.post(
                NEW_EXPERIMENT_URL,
                experimentData,
                {
                    method: 'POST',
                    headers: {
                        "X-API-Key": secrets.agwater_api_key,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data.success) {
                message.success(`Experiment created successfully! ID: ${response.data.experiment_id}`);
                // Reset form and data
                form.resetFields();
                setBeds([]);
            } else {
                message.error(response.data.message || 'Failed to create experiment');
            }
        } catch (error) {
            message.error(error.response?.data?.message || error.message || 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Bed management functions
    const handleAddBed = () => {
        setEditingBed(null);
        bedForm.resetFields();
        setBedModalVisible(true);
    };

    const handleEditBed = (bed, index) => {
        setEditingBed({ ...bed, index });
        bedForm.setFieldsValue({
            ...bed,
            // irrig_start: dayjs(bed.irrig_start),
            // irrig_stop: dayjs(bed.irrig_stop)
        });
        setBedModalVisible(true);
    };

    const handleSaveBed = async () => {
        try {
            const values = await bedForm.validateFields();
            
            // Check if bed_index is already taken (only for new beds or when changing bed_index)
            const bedIndexTaken = beds.some((bed, i) => 
                bed.bed_index === values.bed_index && 
                (!editingBed || editingBed.index !== i)
            );
            
            if (bedIndexTaken) {
                message.error(`Bed Index ${values.bed_index} is already taken by another bed`);
                return;
            }
            
            const bedData = {
                ...values,
                // irrig_start: values.irrig_start,
                // irrig_stop: values.irrig_stop,
                irrig_profile: editingBed ? editingBed.irrig_profile : null,
                sensor_configurations: editingBed ? editingBed.sensor_configurations || [] : []
            };

            if (editingBed) {
                const newBeds = [...beds];
                newBeds[editingBed.index] = bedData;
                setBeds(newBeds);
            } else {
                setBeds([...beds, bedData]);
            }

            setBedModalVisible(false);
            bedForm.resetFields();
            setEditingBed(null);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDeleteBed = (index) => {
        const newBeds = beds.filter((_, i) => i !== index);
        setBeds(newBeds);
    };

    // Sensor management functions
    const handleAddSensor = (bedIndex) => {
        setSelectedBedIndex(bedIndex);
        setEditingSensor(null);
        setIsNewSensor(false);
        sensorForm.resetFields();
        setSensorModalVisible(true);
    };

    const handleEditSensor = (sensor, bedIndex, sensorIndex) => {
        setSelectedBedIndex(bedIndex);
        setEditingSensor({ ...sensor, sensorIndex });
        // Determine if this is a new sensor (has name/description) or existing (has sensor_id)
        setIsNewSensor(!!sensor.name);
        sensorForm.setFieldsValue(sensor);
        setSensorModalVisible(true);
    };

    const handleSaveSensor = async () => {
        try {
            const values = await sensorForm.validateFields();
            
            // Check validation based on sensor type
            if (!isNewSensor && !values.sensor_id) {
                message.error('Please enter sensor ID for existing sensor');
                return;
            }
            
            if (isNewSensor && (!values.name || !values.description)) {
                message.error('Please enter name and description for new sensor');
                return;
            }
            
            // Check if sensor_id is already taken in this bed (only for existing sensors)
            const currentBed = beds[selectedBedIndex];
            if (!isNewSensor) {
                const sensorIdTaken = currentBed.sensor_configurations?.some((sensor, i) => 
                    sensor.sensor_id === values.sensor_id && 
                    (!editingSensor || editingSensor.sensorIndex !== i)
                );
                
                if (sensorIdTaken) {
                    message.error(`Sensor ID ${values.sensor_id} is already taken in this bed`);
                    return;
                }
            }
            
            const newBeds = [...beds];
            if (!newBeds[selectedBedIndex].sensor_configurations) {
                newBeds[selectedBedIndex].sensor_configurations = [];
            }
            
            // Create sensor configuration object based on type
            const sensorConfig = {
                address: values.address,
                depth: values.depth,
                ...(isNewSensor ? {
                    // For new sensors, include name and description
                    name: values.name,
                    description: values.description
                } : {
                    // For existing sensors, include sensor_id
                    sensor_id: values.sensor_id
                })
            };
            
            if (editingSensor) {
                newBeds[selectedBedIndex].sensor_configurations[editingSensor.sensorIndex] = sensorConfig;
            } else {
                newBeds[selectedBedIndex].sensor_configurations.push(sensorConfig);
            }
            
            setBeds(newBeds);
            setSensorModalVisible(false);
            sensorForm.resetFields();
            setEditingSensor(null);
            setSelectedBedIndex(null);
            setIsNewSensor(false);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDeleteSensor = (bedIndex, sensorIndex) => {
        const newBeds = [...beds];
        newBeds[bedIndex].sensor_configurations.splice(sensorIndex, 1);
        setBeds(newBeds);
    };

    // Irrigation profile management functions
    const handleEditIrrigProfile = (bedIndex) => {
        const bed = beds[bedIndex];
        setEditingBedForProfile(bedIndex);
        
        // Parse existing irrigation profile if it exists
        let profilePairs = [];
        if (bed.irrig_profile) {
            try {
                const timestamps = JSON.parse(bed.irrig_profile);
                // Group timestamps into pairs (start, end)
                for (let i = 0; i < timestamps.length; i += 2) {
                    if (timestamps[i] && timestamps[i + 1]) {
                        profilePairs.push({
                            start: dayjs(timestamps[i]),
                            end: dayjs(timestamps[i + 1])
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing irrigation profile:', error);
            }
        }
        
        irrigProfileForm.setFieldsValue({
            profilePairs: profilePairs.length > 0 ? profilePairs : [{ start: null, end: null }]
        });
        setIrrigProfileModalVisible(true);
    };

    const handleSaveIrrigProfile = async () => {
        try {
            const values = await irrigProfileForm.validateFields();
            const profilePairs = values.profilePairs || [];
            
            // Validate that all pairs have both start and end times
            const validPairs = profilePairs.filter(pair => pair.start && pair.end);
            
            if (validPairs.length === 0) {
                message.error('Please add at least one complete irrigation time pair');
                return;
            }
            
            // Validate that start times are before end times
            for (let pair of validPairs) {
                if (pair.start.isAfter(pair.end)) {
                    message.error('Start time must be before end time for all irrigation periods');
                    return;
                }
            }
            
            // Create the irrigation profile JSON string.
            const timestamps = [];
            validPairs.forEach(pair => {
                timestamps.push(pair.start.toISOString());
                timestamps.push(pair.end.toISOString());
            });
            
            const newBeds = [...beds];
            newBeds[editingBedForProfile].irrig_profile = JSON.stringify(timestamps);
            //newBeds[editingBedForProfile].irrig_profile = timestamps;
            setBeds(newBeds);
            
            setIrrigProfileModalVisible(false);
            irrigProfileForm.resetFields();
            setEditingBedForProfile(null);
            message.success('Irrigation profile saved successfully');
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    // Table columns for beds
    const bedColumns = [
        {
            title: 'Bed Index',
            dataIndex: 'bed_index',
            key: 'bed_index',
            width: 80,
        },
        {
            title: 'Soil Type',
            dataIndex: 'soil_type',
            key: 'soil_type',
            width: 120,
            render: (soil_type_id) => {
                const soilType = soilTypes.find(st => st.id === soil_type_id);
                return soilType ? soilType.name : 'Unknown';
            },
        },
        {
            title: 'Irrigation Mode',
            dataIndex: 'irrig_mode',
            key: 'irrig_mode',
            width: 120,
        },
        {
            title: 'Rate',
            dataIndex: 'irrig_rate',
            key: 'irrig_rate',
            width: 80,
            render: (value) => `${value} L/h`,
        },
        {
            title: 'Total',
            dataIndex: 'irrig_total',
            key: 'irrig_total',
            width: 80,
            render: (value) => `${value} L`,
        },
        {
            title: 'Sensors',
            key: 'sensors',
            width: 80,
            render: (_, record) => (
                <span>{record.sensor_configurations?.length || 0} sensors</span>
            ),
        },
        {
            title: 'Profile',
            key: 'irrig_profile',
            width: 100,
            render: (_, record) => {
                if (!record.irrig_profile) {
                    return <Tag color="red">No Profile</Tag>;
                }
                try {
                    const timestamps = JSON.parse(record.irrig_profile);
                    const pairs = timestamps.length / 2;
                    return <Tag color="green">{pairs} period{pairs !== 1 ? 's' : ''}</Tag>;
                } catch {
                    return <Tag color="red">Invalid</Tag>;
                }
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 280,
            render: (_, record, index) => (
                <Space wrap>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditBed(record, index)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddSensor(index)}
                    >
                        Add Sensor
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        onClick={() => handleEditIrrigProfile(index)}
                        style={{ backgroundColor: '#f0f8ff', borderColor: '#1890ff' }}
                    >
                        Profile
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this bed?"
                        onConfirm={() => handleDeleteBed(index)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Table columns for sensors
    const sensorColumns = [
        {
            title: 'Type',
            key: 'type',
            width: 80,
            render: (_, record) => (
                <Tag color={record.sensor_id ? 'blue' : 'green'}>
                    {record.sensor_id ? 'Existing' : 'New'}
                </Tag>
            ),
        },
        {
            title: 'Sensor ID',
            dataIndex: 'sensor_id',
            key: 'sensor_id',
            width: 100,
            render: (sensor_id) => sensor_id || 'N/A',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 120,
            render: (name) => name || 'N/A',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 150,
            render: (description) => description || 'N/A',
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            width: 80,
        },
        {
            title: 'Depth (cm)',
            dataIndex: 'depth',
            key: 'depth',
            width: 100,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record, sensorIndex) => {
                const bedIndex = beds.findIndex(bed => 
                    bed.sensor_configurations?.includes(record)
                );
                return (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditSensor(record, bedIndex, sensorIndex)}
                        >
                            Edit
                        </Button>
                        <Popconfirm
                            title="Are you sure you want to delete this sensor?"
                            onConfirm={() => handleDeleteSensor(bedIndex, sensorIndex)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#000', minHeight: '100vh' }}>
            <Title level={2} style={{ color: 'yellow', marginBottom: '24px' }}>
                <ExperimentOutlined /> Create New Experiment
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    active: true,
                    poll_interval: 600,
                }}
            >
                <Tabs defaultActiveKey="1" type="card">
                    <TabPane tab={<span><ExperimentOutlined />Experiment Details</span>} key="1">
                        <Card title="Basic Information">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Experiment Name"
                                        name="name"
                                        rules={[{ required: true, message: 'Please enter experiment name' }]}
                                    >
                                        <Input placeholder="Enter experiment name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Poll Interval (seconds)"
                                        name="poll_interval"
                                        rules={[{ required: true, message: 'Please enter poll interval' }]}
                                    >
                                        <InputNumber
                                            placeholder="600"
                                            min={1}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Form.Item
                                label="Description"
                                name="description"
                                rules={[{ required: true, message: 'Please enter experiment description' }]}
                            >
                                <TextArea
                                    placeholder="Enter experiment description"
                                    rows={4}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        label="Start Date"
                                        name="start_date"
                                        rules={[{ required: true, message: 'Please select start date' }]}
                                    >
                                        <DatePicker
                                            showTime
                                            style={{ width: '100%' }}
                                            placeholder="Select start date"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        label="End Date"
                                        name="end_date"
                                        rules={[{ required: true, message: 'Please select end date' }]}
                                    >
                                        <DatePicker
                                            showTime
                                            style={{ width: '100%' }}
                                            placeholder="Select end date"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        label="Active"
                                        name="active"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </TabPane>

                    <TabPane tab={<span><EnvironmentOutlined />Beds & Sensors ({beds.length})</span>} key="2">
                        <Card 
                            title="Experiment Beds & Sensors"
                            extra={
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddBed}
                                >
                                    Add Bed
                                </Button>
                            }
                        >
                            <Table
                                columns={bedColumns}
                                dataSource={beds}
                                rowKey="bed_index"
                                size="small"
                                pagination={false}
                                locale={{ emptyText: 'No beds added yet. Click "Add Bed" to get started.' }}
                                expandable={{
                                    expandedRowRender: (record, index) => (
                                        <div style={{ margin: 0 }}>
                                            <Typography.Text strong style={{ marginBottom: 16, display: 'block' }}>
                                                Sensors for Bed {record.bed_index} ({record.sensor_configurations?.length || 0} sensors)
                                            </Typography.Text>
                                            {record.sensor_configurations && record.sensor_configurations.length > 0 ? (
                                                <Table
                                                    columns={sensorColumns}
                                                    dataSource={record.sensor_configurations}
                                                    rowKey={(sensor, index) => sensor.sensor_id || `new-${index}`}
                                                    size="small"
                                                    pagination={false}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                    No sensors configured for this bed
                                                </div>
                                            )}
                                        </div>
                                    ),
                                    expandRowByClick: true,
                                }}
                            />
                        </Card>
                    </TabPane>
                </Tabs>

                <Divider />

                <Row justify="center">
                    <Space>
                        <Button type="default" size="large" onClick={() => {
                            form.resetFields();
                            setBeds([]);
                        }}>
                            Reset Form
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<SaveOutlined />}
                            htmlType="submit"
                            loading={loading}
                        >
                            Create Experiment
                        </Button>
                    </Space>
                </Row>
            </Form>

            {/* Bed Modal */}
            <Modal
                title={editingBed ? 'Edit Bed' : 'Add New Bed'}
                visible={bedModalVisible}
                onOk={handleSaveBed}
                onCancel={() => {
                    setBedModalVisible(false);
                    bedForm.resetFields();
                    setEditingBed(null);
                }}
                width={600}
            >
                <Form form={bedForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Bed Index"
                                name="bed_index"
                                rules={[
                                    { required: true, message: 'Please select bed index' },
                                    { type: 'number', min: 0, max: 7, message: 'Bed index must be between 0-7' }
                                ]}
                            >
                                <Select placeholder="Select bed index">
                                    {bedIndexes.map(index => (
                                        <Option key={index} value={index}>Bed {index}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Soil Type"
                                name="soil_type"
                                rules={[{ required: true, message: 'Please select soil type' }]}
                            >
                                <Select placeholder="Select soil type">
                                    {soilTypes.map(type => (
                                        <Option key={type.id} value={type.id}>{type.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Irrigation Mode"
                                name="irrig_mode"
                                rules={[{ required: true, message: 'Please select irrigation mode' }]}
                            >
                                <Select placeholder="Select irrigation mode">
                                    {irrigationModes.map(mode => (
                                        <Option key={mode} value={mode}>{mode}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                label="Irrigation Rate (L/h)"
                                name="irrig_rate"
                                rules={[{ required: true, message: 'Please enter irrigation rate' }]}
                            >
                                <InputNumber
                                    placeholder="1.5"
                                    min={0}
                                    step={0.1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Total Irrigation (L)"
                                name="irrig_total"
                                rules={[{ required: true, message: 'Please enter total irrigation' }]}
                            >
                                <InputNumber
                                    placeholder="100.0"
                                    min={0}
                                    step={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        {/* The irrig_start and irrig_stop fields have been replaced by the irrig_profile list of start and stop times */}
                        {/* <Col span={6}>
                            <Form.Item
                                label="Irrigation Start"
                                name="irrig_start"
                                rules={[{ required: true, message: 'Please select irrigation start time' }]}
                            >
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Irrigation Stop"
                                name="irrig_stop"
                                rules={[{ required: true, message: 'Please select irrigation stop time' }]}
                            >
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>*/}
                    </Row>
                </Form>
            </Modal>

            {/* Sensor Modal */}
            <Modal
                title={editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
                visible={sensorModalVisible}
                onOk={handleSaveSensor}
                onCancel={() => {
                    setSensorModalVisible(false);
                    sensorForm.resetFields();
                    setEditingSensor(null);
                    setSelectedBedIndex(null);
                    setIsNewSensor(false);
                }}
                width={600}
            >
                <Form form={sensorForm} layout="vertical">
                    {/* Sensor Type Selection */}
                    <Form.Item label="Sensor Type">
                        <Select
                            value={isNewSensor ? 'new' : 'existing'}
                            onChange={(value) => {
                                setIsNewSensor(value === 'new');
                                sensorForm.resetFields(['sensor_id', 'name', 'description']);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Option value="existing">Use Existing Sensor (Sensor ID only)</Option>
                            <Option value="new">Create New Sensor (Name & Description required)</Option>
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        {!isNewSensor ? (
                            <Col span={12}>
                                <Form.Item
                                    label="Sensor ID"
                                    name="sensor_id"
                                    rules={[{ required: !isNewSensor, message: 'Please enter sensor ID' }]}
                                >
                                    <InputNumber
                                        placeholder="1"
                                        min={1}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        ) : (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Sensor Name"
                                        name="name"
                                        rules={[{ required: isNewSensor, message: 'Please enter sensor name' }]}
                                    >
                                        <Input placeholder="Moisture Sensor 1" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Sensor Description"
                                        name="description"
                                        rules={[{ required: isNewSensor, message: 'Please enter sensor description' }]}
                                    >
                                        <Input placeholder="Measures soil moisture content" />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        <Col span={isNewSensor ? 12 : 12}>
                            <Form.Item
                                label="Address"
                                name="address"
                                rules={[{ required: true, message: 'Please enter sensor address' }]}
                            >
                                <Input placeholder="a" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Depth (cm)"
                        name="depth"
                        rules={[{ required: true, message: 'Please enter sensor depth' }]}
                    >
                        <InputNumber
                            placeholder="10.0"
                            min={0}
                            step={0.1}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Irrigation Profile Modal */}
            <Modal
                title={`Irrigation Profile - Bed ${editingBedForProfile !== null ? beds[editingBedForProfile]?.bed_index : ''}`}
                visible={irrigProfileModalVisible}
                onOk={handleSaveIrrigProfile}
                onCancel={() => {
                    setIrrigProfileModalVisible(false);
                    irrigProfileForm.resetFields();
                    setEditingBedForProfile(null);
                }}
                width={800}
                okText="Save Profile"
                cancelText="Cancel"
            >
                <Alert
                    message="Irrigation Profile Configuration"
                    description="Define multiple irrigation periods by specifying start and end timestamps. Each pair represents when irrigation should turn ON and then OFF."
                    type="info"
                    style={{ marginBottom: 16 }}
                />
                
                <Form form={irrigProfileForm} layout="vertical">
                    <Form.List name="profilePairs">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card 
                                        key={key} 
                                        size="small" 
                                        style={{ marginBottom: 16 }}
                                        title={`Irrigation Period ${name + 1}`}
                                        extra={
                                            fields.length > 1 && (
                                                <Button
                                                    type="link"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => remove(name)}
                                                >
                                                    Remove
                                                </Button>
                                            )
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'start']}
                                                    label="Start Time (Irrigation ON)"
                                                    rules={[
                                                        { required: true, message: 'Please select start time' }
                                                    ]}
                                                >
                                                    <DatePicker
                                                        showTime
                                                        style={{ width: '100%' }}
                                                        placeholder="Select start time"
                                                        format="YYYY-MM-DD HH:mm:ss"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'end']}
                                                    label="End Time (Irrigation OFF)"
                                                    rules={[
                                                        { required: true, message: 'Please select end time' }
                                                    ]}
                                                >
                                                    <DatePicker
                                                        showTime
                                                        style={{ width: '100%' }}
                                                        placeholder="Select end time"
                                                        format="YYYY-MM-DD HH:mm:ss"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add({ start: null, end: null })}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Add Irrigation Period
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
                
                {/* Preview of current profile */}
                {editingBedForProfile !== null && beds[editingBedForProfile]?.irrig_profile && (
                    <Card title="Current Profile Preview" size="small" style={{ marginTop: 16 }}>
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {(() => {
                                try {
                                    const timestamps = JSON.parse(beds[editingBedForProfile].irrig_profile);
                                    const pairs = [];
                                    for (let i = 0; i < timestamps.length; i += 2) {
                                        if (timestamps[i] && timestamps[i + 1]) {
                                            pairs.push({
                                                start: dayjs(timestamps[i]).format('YYYY-MM-DD HH:mm:ss'),
                                                end: dayjs(timestamps[i + 1]).format('YYYY-MM-DD HH:mm:ss')
                                            });
                                        }
                                    }
                                    return pairs.map((pair, index) => (
                                        <div key={index} style={{ marginBottom: 8 }}>
                                            <Tag color="green">Period {index + 1}</Tag>
                                            <span>{pair.start} → {pair.end}</span>
                                        </div>
                                    ));
                                } catch {
                                    return <span style={{ color: 'red' }}>Invalid profile format</span>;
                                }
                            })()}
                        </div>
                    </Card>
                )}
            </Modal>
        </div>
    );
};

export default NewExperiment;