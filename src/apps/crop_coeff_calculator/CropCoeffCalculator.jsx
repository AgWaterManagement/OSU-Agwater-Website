import { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, Typography, message, Spin, Row, Col, Table, Modal } from 'antd';
import { CalculatorOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { secrets } from "../../secrets";
const { Title, Text } = Typography;
const { Option } = Select;

const API_URL = 'https://agwater.org:5556/crop_coeff';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Oregon bounds
const OREGON_CENTER = [44.0, -120.5];
const OREGON_BOUNDS = [
    [41.99, -124.6], // Southwest corner
    [46.3, -116.5]   // Northeast corner
];

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position === null ? null : <Marker position={position} />;
};

const CropCoeffCalculator = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [crops, setCrops] = useState([]);
    const [results, setResults] = useState(null);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [tempPosition, setTempPosition] = useState(null);

    // Fetch available crops on mount
    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/crops`, {
                headers: {
                    "X-API-Key": secrets.agwater_api_key
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch crops');
            }
            const data = await response.json();
            setCrops(data.crops || []);
        } catch (error) {
            console.error('Error fetching crops:', error);
            message.error('Failed to load crop list');
        } finally {
            setLoading(false);
        }
    };

    const openMapModal = () => {
        const currentLat = form.getFieldValue('latitude') || OREGON_CENTER[0];
        const currentLng = form.getFieldValue('longitude') || OREGON_CENTER[1];
        setTempPosition([parseFloat(currentLat), parseFloat(currentLng)]);
        setMapModalVisible(true);
    };

    const handleMapOk = () => {
        if (tempPosition) {
            form.setFieldsValue({
                latitude: tempPosition[0].toFixed(4),
                longitude: tempPosition[1].toFixed(4)
            });
            message.success('Location updated from map');
        }
        setMapModalVisible(false);
    };

    const onFinish = async (values) => {
        setCalculating(true);
        setResults(null);

        try {
            const requestBody = {
                latitude: parseFloat(values.latitude),
                longitude: parseFloat(values.longitude),
                crop: values.crop,
                planting_date: values.planting_date.format('YYYY-MM-DD')
            };

            const response = await fetch(`${API_URL}/calculate`, {
                method: 'POST',
                headers: {
                    "X-API-Key": secrets.agwater_api_key,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setResults(data);
                message.success('Crop coefficients calculated successfully');
            } else {
                message.error(data.message || 'Calculation failed');
            }
        } catch (error) {
            console.error('Error calculating crop coefficients:', error);
            message.error('Failed to calculate crop coefficients. Please try again.');
        } finally {
            setCalculating(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Growth Stage',
            dataIndex: 'growth_stage',
            key: 'growth_stage',
        },
        {
            title: 'Kc Value',
            dataIndex: 'kc_value',
            key: 'kc_value',
            render: (val) => val?.toFixed(2)
        },
        {
            title: 'ETc (mm)',
            dataIndex: 'etc',
            key: 'etc',
            render: (val) => val?.toFixed(2)
        }
    ];

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={2}>
                <CalculatorOutlined /> Crop Coefficient Calculator
            </Title>

            <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
                Calculate crop coefficients (Kc) based on location, crop type, and planting date.
            </Text>

            <Row gutter={16}>
                <Col xs={24} md={10}>
                    <Card title="Input Parameters" loading={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                latitude: 44.56,
                                longitude: -123.26
                            }}
                        >
                            <Row gutter={8}>
                                <Col span={8}>
                                    <Form.Item
                                        label="Latitude"
                                        name="latitude"
                                        rules={[
                                            { required: true, message: 'Please enter latitude' },
                                            {
                                                pattern: /^-?([0-9]|[1-8][0-9]|90)(\.[0-9]+)?$/,
                                                message: 'Enter valid latitude (-90 to 90)'
                                            }
                                        ]}
                                    >
                                        <Input
                                            placeholder="e.g., 44.56"
                                            type="number"
                                            step="0.0001"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        label="Longitude"
                                        name="longitude"
                                        rules={[
                                            { required: true, message: 'Please enter longitude' },
                                            {
                                                pattern: /^-?([0-9]|[1-9][0-9]|1[0-7][0-9]|180)(\.[0-9]+)?$/,
                                                message: 'Enter valid longitude (-180 to 180)'
                                            }
                                        ]}
                                    >
                                        <Input
                                            placeholder="e.g., -123.26"
                                            type="number"
                                            step="0.0001"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Button
                                type='primary'
                                icon={<EnvironmentOutlined />}
                                onClick={openMapModal}
                                style={{ marginBottom: '16px', width: '100%', maxWidth: '16em'}}
                            >
                                Pick Location from Map
                            </Button>

                            <Form.Item
                                label="Crop"
                                name="crop"
                                rules={[{ required: true, message: 'Please select a crop' }]}
                            >
                                <Select
                                    placeholder="Select a crop"
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {crops.map(crop => (
                                        <Option key={crop.id} value={crop.id}>
                                            {crop.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Planting Date"
                                name="planting_date"
                                rules={[{ required: true, message: 'Please select planting date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={calculating}
                                    block
                                    icon={<CalculatorOutlined />}
                                >
                                    Calculate Crop Coefficients
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} md={14}>
                    <Card title="Results">
                        {calculating && (
                            <div style={{ textAlign: 'center', padding: '50px' }}>
                                <Spin size="large" />
                                <Text style={{ display: 'block', marginTop: '20px' }}>
                                    Calculating crop coefficients...
                                </Text>
                            </div>
                        )}

                        {!calculating && !results && (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                                <Text type="secondary">
                                    Enter location, crop, and planting date to calculate crop coefficients
                                </Text>
                            </div>
                        )}

                        {results && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <Text strong>Crop: </Text>
                                    <Text>{results.crop_name}</Text>
                                    <br />
                                    <Text strong>Location: </Text>
                                    <Text>
                                        {results.latitude?.toFixed(4)}, {results.longitude?.toFixed(4)}
                                    </Text>
                                    <br />
                                    <Text strong>Planting Date: </Text>
                                    <Text>{results.planting_date}</Text>
                                    <br />
                                    <Text strong>Growing Season: </Text>
                                    <Text>{results.season_length} days</Text>
                                </div>

                                <Table
                                    dataSource={results.kc_values}
                                    columns={columns}
                                    rowKey="date"
                                    pagination={{ pageSize: 10 }}
                                    size="small"
                                    scroll={{ x: 'max-content' }}
                                />
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Select Location on Map"
                open={mapModalVisible}
                onOk={handleMapOk}
                onCancel={() => setMapModalVisible(false)}
                width={600}
                okText="Use This Location"
                cancelButtonProps={{ style: { color: 'blue' } }}
            >
                <div style={{ marginBottom: '10px' }}>
                    <Text type="primary">Click on the map to select a location</Text>
                    {tempPosition && (
                        <div style={{ marginTop: '8px' }}>
                            <Text strong>Selected: </Text>
                            <Text>
                                Lat: {tempPosition[0].toFixed(4)}, Lng: {tempPosition[1].toFixed(4)}
                            </Text>
                        </div>
                    )}
                </div>
                <div style={{ height: 500, width: '100%' }}>
                    <MapContainer
                        center={tempPosition || OREGON_CENTER}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        maxBounds={OREGON_BOUNDS}
                        maxBoundsViscosity={1.0}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker position={tempPosition} setPosition={setTempPosition} />
                    </MapContainer>
                </div>
            </Modal>
        </div>
    );
};

export default CropCoeffCalculator;