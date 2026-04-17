import { useState, useEffect } from "react";
import { useMediaQuery } from 'react-responsive';
import PropTypes from 'prop-types';
import { 
    Card, 
    Input, 
    Select, 
    Button, 
    Space, 
    Tag, 
    Typography, 
    Divider, 
    Tooltip,
    Modal,
    Alert,
    Empty,
    Collapse,
    Row,
    Col,
    Badge,
    Descriptions,
    Table,
    Statistic
} from "antd";
import { 
    SearchOutlined, 
    ReloadOutlined,
    ExperimentOutlined,
    EnvironmentOutlined,
    SlidersOutlined,
    ClockCircleOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { secrets } from '../../secrets';

const { Search } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const EXPERIMENT_CARD_URL = "https://agwater.org:5556/sensor/experiment_card";

const SensorExperimentCards = ({ selectedExpId = null }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedBedIndex, setSelectedBedIndex] = useState("all");
    const [selectedExperiment, setSelectedExperiment] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
    const isDesktop = useMediaQuery({ minWidth: 1025 });

    // Helper function to parse and display irrigation profile
    const parseIrrigationProfile = (irrigProfile) => {
        if (!irrigProfile || !Array.isArray(irrigProfile) || irrigProfile.length === 0) {
            return { periods: [], display: 'No irrigation profile set' };
        }

        try {
            const periods = [];
            
            // Group timestamps into pairs (start, end)
            for (let i = 0; i < irrigProfile.length; i += 2) {
                if (irrigProfile[i] && irrigProfile[i + 1]) {
                    periods.push({
                        start: dayjs(irrigProfile[i]),
                        end: dayjs(irrigProfile[i + 1])
                    });
                }
            }

            if (periods.length === 0) {
                return { periods: [], display: 'Empty irrigation profile' };
            }

            const displayText = `${periods.length} irrigation period${periods.length !== 1 ? 's' : ''}`;
            return { periods, display: displayText };
        } catch (error) {
            console.error('Error parsing irrigation profile:', error);
            return { periods: [], display: 'Invalid irrigation profile format' };
        }
    };

    // Fetch data from API
    const fetchData = async (expId = null) => {
        setLoading(true);
        setError(null);
        try {
            const url = expId 
                ? `${EXPERIMENT_CARD_URL}?exp_id=${expId}`
                : EXPERIMENT_CARD_URL;
                
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "X-API-Key": secrets.agwater_api_key,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data)) {
                setData(result.data);
                setFilteredData(result.data);
            } else {
                console.error("Unexpected API response format:", result);
                setError(result.message || "Invalid response format");
                setData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching experiment data:", error);
            setError(error.message);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedExpId);
    }, [selectedExpId]);

    // Filter data based on search and status
    useEffect(() => {
        let filtered = data;

        // Apply search filter
        if (searchText) {
            filtered = filtered.filter(experiment =>
                experiment.name.toLowerCase().includes(searchText.toLowerCase()) ||
                experiment.description.toLowerCase().includes(searchText.toLowerCase()) ||
                experiment.beds.some(bed => 
                    bed.bed_index.toString().includes(searchText.toLowerCase()) ||
                    (bed.name && bed.name.toLowerCase().includes(searchText.toLowerCase())) ||
                    bed.irrig_mode.toLowerCase().includes(searchText.toLowerCase()) ||
                    (bed.soil_type_id && bed.soil_type_id.toString().toLowerCase().includes(searchText.toLowerCase())) ||
                    parseIrrigationProfile(bed.irrig_profile).display.toLowerCase().includes(searchText.toLowerCase()) ||
                    bed.sensors?.some(sensor =>
                        sensor.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        sensor.description.toLowerCase().includes(searchText.toLowerCase())
                    )
                )
            );
        }

        // Apply status filter
        if (selectedStatus !== "all") {
            const isActive = selectedStatus === "active";
            filtered = filtered.filter(experiment => experiment.active === isActive);
        }

        // Apply bed index filter
        if (selectedBedIndex !== "all") {
            const bedIndex = parseInt(selectedBedIndex);
            filtered = filtered.filter(experiment => 
                experiment.beds && experiment.beds.some(bed => bed.bed_index === bedIndex)
            );
        }

        setFilteredData(filtered);
    }, [data, searchText, selectedStatus, selectedBedIndex]);

    // Render sensor observations table
    const renderSensorObservations = (observations) => {
        const columns = [
            {
                title: 'Measurement',
                dataIndex: 'measurement',
                key: 'measurement',
                width: isMobile ? 100 : 120,
                render: (text) => <Tag color="blue">{text}</Tag>
            },
            {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
                width: isMobile ? 80 : 100,
                render: (value, record) => (
                    <Space>
                        <Text strong>{value} {record.units}</Text>
                        {record.is_irrigated && <Tag color="green" size="small">Irrigated</Tag>}
                    </Space>
                )
            },
            {
                title: 'Time',
                dataIndex: 'timestamp',
                key: 'timestamp',
                width: isMobile ? 80 : 120,
                render: (timestamp) => dayjs(timestamp).format(isMobile ? 'MM/DD HH:mm' : 'MMM DD, HH:mm')
            }
        ];

        return (
            <Table
                columns={columns}
                dataSource={observations}
                rowKey={(record, index) => `${record.measurement}-${index}`}
                pagination={false}
                size="small"
                scroll={isMobile ? { x: 260 } : undefined}
            />
        );
    };

    // Render sensor card
    const renderSensor = (sensor) => (
        <Card
            key={sensor.sensor_id}
            size="small"
            title={
                <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
                    <Space>
                        <SlidersOutlined />
                        <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>
                            {sensor.name}
                        </Text>
                    </Space>
                    <Tag color="green" size={isMobile ? "small" : "default"}>
                        Depth: {sensor.depth}m
                    </Tag>
                </Space>
            }
            extra={
                !isMobile && (
                    <Space>
                        <Text strong>Address: </Text>
                        <Text code>{sensor.address}</Text>
                    </Space>
                )
            }
            style={{ marginBottom: 8 }}
        >
            {isMobile && (
                <div style={{ marginBottom: 8 }}>
                    <Text strong>Address: </Text>
                    <Text code>{sensor.address}</Text>
                </div>
            )}
            {sensor.observations && sensor.observations.length > 0 ? (
                renderSensorObservations(sensor.observations)
            ) : (
                <Empty 
                    description="No recent observations" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ margin: '16px 0', color: 'white' }}
                />
            )}
        </Card>
    );

    // Render bed card
    const renderBed = (bed) => (
        <Card
            key={bed.bed_index}
            title={
                <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
                    <Space>
                        <EnvironmentOutlined />
                        <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                            {bed.name || `Bed ${bed.bed_index}`}
                        </Text>
                    </Space>
                    <Space wrap>
                        <Tag color="orange" size={isMobile ? "small" : "default"}>
                            Soil Type: {bed.soil_type_id}
                        </Tag>
                        <Tag color="cyan" size={isMobile ? "small" : "default"}>
                            {bed.irrig_mode}
                        </Tag>
                    </Space>
                </Space>
            }
            style={{ marginBottom: 16 }}
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={12} lg={8}>
                    <Descriptions
                        size="small"
                        column={1}
                        labelStyle={{ fontSize: isMobile ? '12px' : '14px', color: 'white' }}
                        contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                    >
                        <Descriptions.Item label="Bed Index">
                            {bed.bed_index}
                        </Descriptions.Item>
                        <Descriptions.Item label="Bed Name">
                            {bed.name || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Soil Type ID">
                            {bed.soil_type_id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Irrigation Rate">
                            {bed.irrig_rate} L/h
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Irrigation">
                            {bed.irrig_total} L
                        </Descriptions.Item>
                        <Descriptions.Item label="Irrigation Profile">
                            <div>
                                <Text>{parseIrrigationProfile(bed.irrig_profile).display}</Text>
                                {parseIrrigationProfile(bed.irrig_profile).periods.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        {parseIrrigationProfile(bed.irrig_profile).periods.map((period, index) => (
                                            <div key={index} style={{ marginBottom: 4 }}>
                                                <Tag color="blue" size="small">
                                                    Period {index + 1}
                                                </Tag>
                                                <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
                                                    {period.start.format(isMobile ? 'MM/DD HH:mm' : 'MMM DD HH:mm')} → {period.end.format(isMobile ? 'MM/DD HH:mm' : 'MMM DD HH:mm')}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
                <Col xs={24} sm={24} md={12} lg={16}>
                    <Title level={5} style={{ marginBottom: 16, fontSize: isMobile ? '14px' : '16px' }}>
                        Sensors ({bed.sensors?.length || 0})
                    </Title>
                    {bed.sensors && bed.sensors.length > 0 ? (
                        bed.sensors.map(sensor => renderSensor(sensor))
                    ) : (
                        <Empty 
                            description="No sensors configured" 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </Col>
            </Row>
        </Card>
    );


    // Render experiment card
    const renderExperiment = (experiment) => (
        <Card
            key={experiment.exp_id}
            style={{ 
                marginBottom: isMobile ? 16 : 24,
                borderRadius: isMobile ? 8 : 12
            }}
            title={
                <Space 
                    direction={isMobile ? "vertical" : "horizontal"} 
                    size="small"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                >
                    <Space>
                        <ExperimentOutlined />
                        <Text 
                            strong 
                            style={{ 
                                fontSize: isMobile ? '16px' : '18px',
                                lineHeight: 1.2
                            }}
                        >
                            {experiment.name}
                        </Text>
                        <Badge 
                            status={experiment.active ? "processing" : "default"} 
                            text={experiment.active ? "Active" : "Inactive"}
                        />
                    </Space>
                    {!isMobile && (
                        <Space>
                            <Tooltip title="Poll Interval">
                                <Tag icon={<ClockCircleOutlined />}>
                                    {experiment.poll_interval}min
                                </Tag>
                            </Tooltip>
                            <Button 
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedExperiment(experiment);
                                    setModalVisible(true);
                                }}
                            >
                                Details
                            </Button>
                        </Space>
                    )}
                </Space>
            }
            extra={
                isMobile && (
                    <Button 
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                            setSelectedExperiment(experiment);
                            setModalVisible(true);
                        }}
                    >
                        Details
                    </Button>
                )
            }
        >
            <div style={{ marginBottom: 16 }}>
                <Paragraph 
                    ellipsis={isMobile ? { rows: 2, expandable: true } : false}
                    style={{ fontSize: isMobile ? '14px' : '16px' }}
                >
                    {experiment.description}
                </Paragraph>
                <Space 
                    wrap 
                    size={isMobile ? "small" : "middle"}
                    direction={isMobile ? "vertical" : "horizontal"}
                >
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', color: 'white' }}>
                        Started: {dayjs(experiment.start_date).format(isMobile ? 'MM/DD/YY' : 'MMM DD, YYYY')}
                    </Text>
                    {experiment.end_date && (
                        <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', color: 'white' }}>
                            Ended: {dayjs(experiment.end_date).format(isMobile ? 'MM/DD/YY' : 'MMM DD, YYYY')}
                        </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', color: 'white' }}>
                        Beds: {experiment.beds?.length || 0}
                    </Text>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px', color: 'white' }}>
                        Sensors: {experiment.beds?.reduce((acc, bed) => acc + (bed.sensors?.length || 0), 0) || 0}
                    </Text>
                    {isMobile && (
                        <Tag icon={<ClockCircleOutlined />} size="small">
                            {experiment.poll_interval}min
                        </Tag>
                    )}
                </Space>
            </div>

            <Collapse 
                defaultActiveKey={experiment.active ? ["0"] : []} 
                ghost
                size={isMobile ? "small" : "default"}
            >
                <Panel 
                    header={
                        <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                            Experimental Beds ({experiment.beds?.length || 0})
                        </Text>
                    } 
                    key="0"
                >
                    {experiment.beds && experiment.beds.length > 0 ? (
                        experiment.beds.map(bed => renderBed(bed))
                    ) : (
                        <Empty 
                            description="No beds configured" 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </Panel>
            </Collapse>
        </Card>
    );

    return (
        <div style={{ 
            padding: isMobile ? 12 : isTablet ? 16 : 24,
            backgroundColor: '#f5f5f5',
            minHeight: '100vh'
        }}>
            <Card style={{ borderRadius: isMobile ? 8 : 12 }}>
                <Title 
                    level={isMobile ? 3 : 2} 
                    style={{ 
                        marginBottom: 24,
                        fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
                        textAlign: isMobile ? 'center' : 'left'
                    }}
                >
                    Sensor Experiment Dashboard
                </Title>
                
                {/* Filters and Search */}
                <div style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={12} lg={10}>
                            <Search
                                placeholder="Search experiments, beds, or sensors..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size={isMobile ? "middle" : "large"}
                                onSearch={setSearchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={3}>
                            <Select
                                value={selectedStatus}
                                onChange={setSelectedStatus}
                                style={{ width: '100%' }}
                                size={isMobile ? "middle" : "large"}
                                placeholder="Filter Status"
                            >
                                <Option value="all">All Status</Option>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={3}>
                            <Select
                                value={selectedBedIndex}
                                onChange={setSelectedBedIndex}
                                style={{ width: '100%' }}
                                size={isMobile ? "middle" : "large"}
                                placeholder="Filter Bed"
                            >
                                <Option value="all">All Beds</Option>
                                {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
                                    <Option key={index} value={index.toString()}>Bed {index}</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={4}>
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={() => fetchData(selectedExpId)}
                                size={isMobile ? "middle" : "large"}
                                style={{ width: '100%' }}
                            >
                                {isMobile ? '' : 'Refresh'}
                            </Button>
                        </Col>
                    </Row>
                </div>

                <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />

                {/* Error Display */}
                {error && (
                    <Alert
                        message="Error Loading Data"
                        description={`Failed to fetch experiment data: ${error}`}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={
                            <Button size="small" onClick={() => fetchData(selectedExpId)}>
                                Retry
                            </Button>
                        }
                    />
                )}

                {/* Summary Statistics */}
                {!loading && !error && filteredData.length > 0 && (
                    <Row gutter={[16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                        <Col xs={12} sm={6} md={6} lg={6}>
                            <Card size="small">
                                <Statistic 
                                    title="Total Experiments" 
                                    value={filteredData.length}
                                    prefix={<ExperimentOutlined />}
                                    valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6} lg={6}>
                            <Card size="small">
                                <Statistic 
                                    title="Active Experiments" 
                                    value={filteredData.filter(exp => exp.active).length}
                                    prefix={<PlayCircleOutlined />}
                                    valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6} lg={6}>
                            <Card size="small">
                                <Statistic 
                                    title="Total Beds" 
                                    value={filteredData.reduce((acc, exp) => acc + (exp.beds?.length || 0), 0)}
                                    prefix={<EnvironmentOutlined />}
                                    valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} md={6} lg={6}>
                            <Card size="small">
                                <Statistic 
                                    title="Total Sensors" 
                                    value={filteredData.reduce((acc, exp) => 
                                        acc + (exp.beds?.reduce((bedAcc, bed) => bedAcc + (bed.sensors?.length || 0), 0) || 0), 0
                                    )}
                                    prefix={<SlidersOutlined />}
                                    valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Experiments Display */}
                {!loading && !error && filteredData.length === 0 ? (
                    <Empty 
                        description="No experiment data available"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: isMobile ? '40px 20px' : '60px 40px' }}
                    />
                ) : (
                    <div style={{ opacity: loading ? 0.6 : 1 }}>
                        {filteredData.map(experiment => renderExperiment(experiment))}
                    </div>
                )}
            </Card>

            {/* Experiment Details Modal */}
            <Modal
                title={
                    <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
                        <Space>
                            <ExperimentOutlined />
                            <Text strong style={{ fontSize: isMobile ? '16px' : '18px' }}>
                                {selectedExperiment?.name}
                            </Text>
                        </Space>
                        <Badge 
                            status={selectedExperiment?.active ? "processing" : "default"} 
                            text={selectedExperiment?.active ? "Active" : "Inactive"}
                        />
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={isMobile ? '95%' : isTablet ? '90%' : 1000}
                style={{ top: isMobile ? 20 : 100 }}
            >
                {selectedExperiment && (
                    <div>
                        <Descriptions 
                            column={isMobile ? 1 : isTablet ? 1 : 2} 
                            bordered
                            size={isMobile ? "small" : "default"}
                            labelStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                            contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                        >
                            <Descriptions.Item label="Experiment ID">
                                {selectedExperiment.exp_id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Poll Interval">
                                {selectedExperiment.poll_interval} minutes
                            </Descriptions.Item>
                            <Descriptions.Item label="Start Date">
                                {dayjs(selectedExperiment.start_date).format(isMobile ? 'MM/DD/YYYY' : 'MMMM DD, YYYY')}
                            </Descriptions.Item>
                            <Descriptions.Item label="End Date">
                                {selectedExperiment.end_date 
                                    ? dayjs(selectedExperiment.end_date).format(isMobile ? 'MM/DD/YYYY' : 'MMMM DD, YYYY')
                                    : 'Ongoing'
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Beds">
                                {selectedExperiment.beds?.length || 0}
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Sensors">
                                {selectedExperiment.beds?.reduce((acc, bed) => acc + (bed.sensors?.length || 0), 0) || 0}
                            </Descriptions.Item>
                            <Descriptions.Item label="Description" span={isMobile ? 1 : 2}>
                                {selectedExperiment.description}
                            </Descriptions.Item>
                        </Descriptions>
                        
                        <Divider orientation="left" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                            Experimental Beds
                        </Divider>
                        
                        {selectedExperiment.beds && selectedExperiment.beds.length > 0 ? (
                            selectedExperiment.beds.map(bed => renderBed(bed))
                        ) : (
                            <Empty description="No beds configured" />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

SensorExperimentCards.propTypes = {
    selectedExpId: PropTypes.number,
};

export default SensorExperimentCards;
