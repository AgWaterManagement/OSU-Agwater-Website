import React, { useState } from 'react';
import {
    Card,
    Upload,
    Button,
    Space,
    Alert,
    Divider,
    Typography,
    Table,
    Modal,
    Progress,
    message,
    Steps,
    Row,
    Col,
    Statistic,
    Tag,
    Tabs,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select
} from 'antd';
import {
    UploadOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    PlusOutlined,
    EditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { secrets } from '../../secrets';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Dragger } = Upload;
const { Option } = Select;

const UPLOAD_OBSERVATIONS_API = 'https://agwater.org:5556/sensor/bulk/fast/observations';

const UploadObservations = () => {
    const [observations, setObservations] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [manualEntryVisible, setManualEntryVisible] = useState(false);
    const [form] = Form.useForm();

    // Common measurement types and units
    const measurementTypes = [
        { type: 'temperature', units: ['°C', '°F', 'K'] },
        { type: 'humidity', units: ['%', 'g/m³'] },
        { type: 'pressure', units: ['Pa', 'kPa', 'MPa', 'bar', 'psi'] },
        { type: 'pH', units: ['pH'] },
        { type: 'conductivity', units: ['µS/cm', 'mS/cm', 'S/m'] },
        { type: 'salinity', units: ['ppt', 'psu'] },
        { type: 'dissolved_oxygen', units: ['mg/L', 'ppm', '%'] },
        { type: 'turbidity', units: ['NTU', 'FTU'] },
        { type: 'flow_rate', units: ['L/min', 'L/s', 'm³/h', 'gpm'] },
        { type: 'water_level', units: ['cm', 'm', 'mm', 'ft', 'in'] },
        { type: 'soil_moisture', units: ['%', 'VWC', 'm³/m³'] }
    ];

    // Validate observation structure
    const validateObservations = (data) => {
        const errors = [];
        
        if (!Array.isArray(data)) {
            errors.push('Data must be an array of observations');
            return errors;
        }

        if (data.length === 0) {
            errors.push('No observations found in the data');
            return errors;
        }

        // Check if all observations have the same structure
        const firstObsKeys = Object.keys(data[0]).sort();
        const requiredFields = ['exp_id', 'bed_index', 'sensor_id', 'timestamp', 'measurement', 'value', 'units'];
        
        // Check required fields in first observation
        const missingRequired = requiredFields.filter(field => !firstObsKeys.includes(field));
        if (missingRequired.length > 0) {
            errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
        }

        // Validate each observation
        data.forEach((obs, index) => {
            const obsKeys = Object.keys(obs).sort();
            
            // Check structure consistency
            if (JSON.stringify(obsKeys) !== JSON.stringify(firstObsKeys)) {
                errors.push(`Observation ${index + 1}: Inconsistent structure with first observation`);
            }

            // Validate required fields
            requiredFields.forEach(field => {
                if (obs[field] === undefined || obs[field] === null || obs[field] === '') {
                    errors.push(`Observation ${index + 1}: Missing or empty ${field}`);
                }
            });

            // Validate data types
            if (obs.exp_id && !Number.isInteger(Number(obs.exp_id))) {
                errors.push(`Observation ${index + 1}: exp_id must be an integer`);
            }
            if (obs.bed_index && !Number.isInteger(Number(obs.bed_index))) {
                errors.push(`Observation ${index + 1}: bed_index must be an integer`);
            }
            if (obs.sensor_id && !Number.isInteger(Number(obs.sensor_id))) {
                errors.push(`Observation ${index + 1}: sensor_id must be an integer`);
            }
            if (obs.value && isNaN(Number(obs.value))) {
                errors.push(`Observation ${index + 1}: value must be a number`);
            }
            if (obs.timestamp && !dayjs(obs.timestamp).isValid()) {
                errors.push(`Observation ${index + 1}: Invalid timestamp format`);
            }
        });

        return errors;
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                let observationsData = [];

                // Handle different JSON structures
                if (jsonData.observations && Array.isArray(jsonData.observations)) {
                    observationsData = jsonData.observations;
                } else if (Array.isArray(jsonData)) {
                    observationsData = jsonData;
                } else {
                    throw new Error('Invalid JSON structure. Expected array of observations or object with "observations" property');
                }

                const errors = validateObservations(observationsData);
                setValidationErrors(errors);

                if (errors.length === 0) {
                    setObservations(observationsData);
                    setCurrentStep(1);
                    message.success(`Successfully loaded ${observationsData.length} observations`);
                } else {
                    setCurrentStep(0);
                    message.error('Validation failed. Please check the errors below.');
                }
            } catch (error) {
                message.error('Error parsing JSON file: ' + error.message);
                setValidationErrors([error.message]);
                setCurrentStep(0);
            }
        };
        reader.readAsText(file);
        return false; // Prevent automatic upload
    };

    // Handle manual observation entry
    const handleManualEntry = () => {
        form.validateFields().then(values => {
            const newObservation = {
                exp_id: values.exp_id,
                bed_index: values.bed_index,
                sensor_id: values.sensor_id,
                timestamp: values.timestamp.toISOString(),
                measurement: values.measurement,
                value: values.value,
                units: values.units
            };

            const updatedObservations = [...observations, newObservation];
            setObservations(updatedObservations);
            
            const errors = validateObservations(updatedObservations);
            setValidationErrors(errors);
            
            if (errors.length === 0) {
                setCurrentStep(1);
            }
            
            setManualEntryVisible(false);
            form.resetFields();
            message.success('Observation added successfully');
        }).catch(error => {
            console.error('Validation failed:', error);
        });
    };

    // Submit observations to API
    const handleUpload = async () => {
        if (observations.length === 0) {
            message.error('No observations to upload');
            return;
        }

        if (validationErrors.length > 0) {
            message.error('Please fix validation errors before uploading');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setCurrentStep(2);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await axios.post(
                UPLOAD_OBSERVATIONS_API,
                { observations },
                {
                    headers: {
                        "X-API-Key": secrets.agwater_api_key,
                        "Content-Type": "application/json"
                    }
                }
            );

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.data.success) {
                setUploadResult(response.data);
                setCurrentStep(3);
                message.success(`Successfully uploaded ${response.data.total_processed} observations`);
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (error) {
            setCurrentStep(1);
            message.error(error.response?.data?.message || error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setObservations([]);
        setValidationErrors([]);
        setUploadResult(null);
        setCurrentStep(0);
        setUploadProgress(0);
        form.resetFields();
    };

    // Delete observation
    const handleDeleteObservation = (index) => {
        const updatedObservations = observations.filter((_, i) => i !== index);
        setObservations(updatedObservations);
        
        if (updatedObservations.length === 0) {
            setCurrentStep(0);
        } else {
            const errors = validateObservations(updatedObservations);
            setValidationErrors(errors);
        }
    };

    // Table columns for observations preview
    const observationColumns = [
        {
            title: 'Exp ID',
            dataIndex: 'exp_id',
            key: 'exp_id',
            width: 80,
        },
        {
            title: 'Bed ID',
            dataIndex: 'bed_index',
            key: 'bed_index',
            width: 80,
        },
        {
            title: 'Sensor ID',
            dataIndex: 'sensor_id',
            key: 'sensor_id',
            width: 100,
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: 'Measurement',
            dataIndex: 'measurement',
            key: 'measurement',
            width: 120,
            render: (measurement) => <Tag color="blue">{measurement}</Tag>,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            width: 100,
            align: 'right',
            render: (value) => typeof value === 'number' ? value.toFixed(2) : value,
        },
        {
            title: 'Units',
            dataIndex: 'units',
            key: 'units',
            width: 80,
            render: (units) => <Tag color="orange">{units}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_, record, index) => (
                <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteObservation(index)}
                >
                    Delete
                </Button>
            ),
        },
    ];

    // Calculate statistics
    const stats = {
        total: observations.length,
        uniqueExperiments: new Set(observations.map(obs => obs.exp_id)).size,
        uniqueBeds: new Set(observations.map(obs => obs.bed_index)).size,
        uniqueSensors: new Set(observations.map(obs => obs.sensor_id)).size,
        uniqueMeasurements: new Set(observations.map(obs => obs.measurement)).size,
        dateRange: observations.length > 0 ? {
            earliest: dayjs.min(observations.map(obs => dayjs(obs.timestamp))),
            latest: dayjs.max(observations.map(obs => dayjs(obs.timestamp)))
        } : null
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#000', minHeight: '100vh' }}>
            <Title level={2} style={{ color: 'yellow', marginBottom: '24px' }}>
                <CloudUploadOutlined /> Upload Observations
            </Title>

            {/* Progress Steps */}
            <Card style={{ marginBottom: '24px' }}>
                <Steps current={currentStep} size="small">
                    <Step title="Load Data" icon={<UploadOutlined />} />
                    <Step title="Review & Validate" icon={<FileTextOutlined />} />
                    <Step title="Upload" icon={<CloudUploadOutlined />} />
                    <Step title="Complete" icon={<CheckCircleOutlined />} />
                </Steps>
            </Card>

            <Tabs defaultActiveKey="1" type="card">
                <TabPane tab={<span><UploadOutlined />File Upload</span>} key="1">
                    {/* File Upload Section */}
                    <Card title="Upload JSON File">
                        <Dragger
                            accept=".json"
                            beforeUpload={handleFileUpload}
                            showUploadList={false}
                            style={{ marginBottom: '16px' }}
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined style={{ color: 'white' }} />
                            </p>
                            <p className="ant-upload-text" style={{ color: 'white' }}>
                                Click or drag JSON file to upload
                            </p>
                            <p className="ant-upload-hint" style={{ color: 'grey' }}>
                                Support for JSON files containing observation data
                            </p>
                        </Dragger>

                        <Alert
                            message="Expected JSON Format"
                            description={
                                <pre style={{ fontSize: '12px', color: 'blue' }}>
{`{
  "observations": [
    {
      "exp_id": 1,
      "bed_index": 1,
      "sensor_id": 1,
      "timestamp": "2025-01-15T10:30:00Z",
      "measurement": "temperature",
      "value": 22.5,
      "units": "°C"
    },...
  ]
}`}
                                </pre>
                            }
                            type="info"
                            showIcon
                        />
                    </Card>
                </TabPane>

                <TabPane tab={<span><EditOutlined />Manual Entry</span>} key="2">
                    {/* Manual Entry Section */}
                    <Card 
                        title="Add Individual Observations"
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setManualEntryVisible(true)}
                            >
                                Add Observation
                            </Button>
                        }
                    >
                        {observations.length === 0 ? (
                            <Alert
                                message="No observations added yet"
                                description="Click 'Add Observation' to manually enter observation data"
                                type="info"
                                showIcon
                            />
                        ) : (
                            <Table
                                columns={observationColumns}
                                dataSource={observations}
                                rowKey={(record, index) => index}
                                size="small"
                                pagination={{ pageSize: 10 }}
                            />
                        )}
                    </Card>
                </TabPane>
            </Tabs>

            {/* Statistics */}
            {observations.length > 0 && (
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="Total Observations" 
                                value={stats.total} 
                                valueStyle={{ color: 'white' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="Unique Experiments" 
                                value={stats.uniqueExperiments} 
                                valueStyle={{ color: 'white' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="Unique Beds" 
                                value={stats.uniqueBeds} 
                                valueStyle={{ color: 'white' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="Unique Sensors" 
                                value={stats.uniqueSensors} 
                                valueStyle={{ color: 'white' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <Alert
                    message="Validation Errors"
                    description={
                        <ul>
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: '24px' }}
                />
            )}

            {/* Data Preview */}
            {observations.length > 0 && validationErrors.length === 0 && (
                <Card 
                    title={`Data Preview (${observations.length} observations)`}
                    extra={
                        <Space>
                            <Button onClick={() => setPreviewVisible(true)}>
                                View All
                            </Button>
                            <Button type="primary" onClick={handleUpload} loading={uploading}>
                                Upload Observations
                            </Button>
                        </Space>
                    }
                    style={{ marginBottom: '24px' }}
                >
                    <Table
                        columns={observationColumns.filter(col => col.key !== 'actions')}
                        dataSource={observations.slice(0, 5)}
                        rowKey={(record, index) => index}
                        size="small"
                        pagination={false}
                    />
                    {observations.length > 5 && (
                        <Text type="secondary">
                            Showing first 5 of {observations.length} observations
                        </Text>
                    )}
                </Card>
            )}

            {/* Upload Progress */}
            {uploading && (
                <Card title="Upload Progress" style={{ marginBottom: '24px' }}>
                    <Progress percent={uploadProgress} status="active" />
                    <Text>Uploading {observations.length} observations...</Text>
                </Card>
            )}

            {/* Upload Result */}
            {uploadResult && (
                <Card title="Upload Complete" style={{ marginBottom: '24px' }}>
                    <Alert
                        message="Upload Successful!"
                        description={
                            <div style={{ color: 'green' }}>
                                <p><strong>Total Processed:</strong> {uploadResult.total_processed}</p>
                                <p><strong>Message:</strong> {uploadResult.message}</p>
                                {uploadResult.record_ids && (
                                    <p><strong>Record IDs:</strong> {uploadResult.record_ids.slice(0, 10).join(', ')}
                                    {uploadResult.record_ids.length > 10 && '...'}</p>
                                )}
                            </div>
                        }
                        type="success"
                        showIcon
                    />
                </Card>
            )}

            {/* Action Buttons */}
            <Row justify="center">
                <Space>
                    <Button type="default" size="large" onClick={handleReset}>
                        Reset
                    </Button>
                    {observations.length > 0 && validationErrors.length === 0 && !uploading && !uploadResult && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<CloudUploadOutlined />}
                            onClick={handleUpload}
                        >
                            Upload {observations.length} Observations
                        </Button>
                    )}
                </Space>
            </Row>

            {/* Preview Modal */}
            <Modal
                title={`All Observations (${observations.length})`}
                visible={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                width={1000}
                footer={null}
            >
                <Table
                    columns={observationColumns}
                    dataSource={observations}
                    rowKey={(record, index) => index}
                    size="small"
                    pagination={{ pageSize: 20 }}
                />
            </Modal>

            {/* Manual Entry Modal */}
            <Modal
                title="Add New Observation"
                visible={manualEntryVisible}
                onOk={handleManualEntry}
                onCancel={() => {
                    setManualEntryVisible(false);
                    form.resetFields();
                }}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Experiment ID"
                                name="exp_id"
                                rules={[{ required: true, message: 'Please enter experiment ID' }]}
                            >
                                <InputNumber
                                    placeholder="1"
                                    min={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Bed Index"
                                name="bed_index"
                                rules={[{ required: true, message: 'Please enter bed index' }]}
                            >
                                <InputNumber
                                    placeholder="1"
                                    min={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Sensor ID"
                                name="sensor_id"
                                rules={[{ required: true, message: 'Please enter sensor ID' }]}
                            >
                                <InputNumber
                                    placeholder="1"
                                    min={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Timestamp"
                        name="timestamp"
                        rules={[{ required: true, message: 'Please select timestamp' }]}
                    >
                        <DatePicker
                            showTime
                            style={{ width: '100%' }}
                            placeholder="Select timestamp"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Measurement Type"
                                name="measurement"
                                rules={[{ required: true, message: 'Please enter measurement type' }]}
                            >
                                <Select placeholder="Select or enter measurement type" allowClear>
                                    {measurementTypes.map(({ type }) => (
                                        <Option key={type} value={type}>{type}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Units"
                                name="units"
                                rules={[{ required: true, message: 'Please enter units' }]}
                            >
                                <Select placeholder="Select or enter units" allowClear>
                                    {measurementTypes.flatMap(({ units }) => units).map(unit => (
                                        <Option key={unit} value={unit}>{unit}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Value"
                        name="value"
                        rules={[{ required: true, message: 'Please enter value' }]}
                    >
                        <InputNumber
                            placeholder="22.5"
                            style={{ width: '100%' }}
                            step={0.1}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UploadObservations;