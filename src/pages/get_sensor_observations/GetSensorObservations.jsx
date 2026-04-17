import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Card, 
    Form, 
    Input, 
    InputNumber, 
    DatePicker, 
    Button, 
    Space, 
    Alert, 
    Spin, 
    Tag, 
    Divider,
    Row,
    Col,
    Statistic,
    Typography
} from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { secrets } from '../../secrets';

dayjs.extend(minMax);

const { RangePicker } = DatePicker;
const { Title } = Typography;

const SENSOR_OBSERVATIONS_URL = 'https://agwater.org:5556/sensor/observations';

const GetSensorObservations = () => {
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 50,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} observations`
    });
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    // Media queries for responsive design
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });
    const isDesktop = useMediaQuery({ minWidth: 1025 });

    // Fetch observations from API
    const fetchObservations = async (filters = {}, observationLimit = limit, observationOffset = offset) => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            
            // Add limit and offset parameters
            // params.append('limit', observationLimit.toString());
            // params.append('offset', observationOffset.toString());
            
            // Add filters to params if they exist
            if (filters.obs_id) params.append('obs_id', filters.obs_id);
            if (filters.exp_id) params.append('exp_id', filters.exp_id);
            if (filters.bed_index) params.append('bed_index', filters.bed_index);
            if (filters.sensor_id) params.append('sensor_id', filters.sensor_id);
            if (filters.measurement) params.append('measurement', filters.measurement);
            if (filters.timestamp_start) params.append('timestamp_start', filters.timestamp_start);
            if (filters.timestamp_end) params.append('timestamp_end', filters.timestamp_end);

            const response = await axios.get(`${SENSOR_OBSERVATIONS_URL}?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        "X-API-Key": secrets.agwater_api_key,
                        "Content-Type": "application/json"
                    }
                });

            if (response.data.success) {
                setObservations(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch observations');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        fetchObservations({}, limit, 0);
    }, []);

    // Handle form submission for filtering
    const handleSearch = (values) => {
        const filters = {};
        
        if (values.obs_id) filters.obs_id = values.obs_id;
        if (values.exp_id) filters.exp_id = values.exp_id;
        if (values.bed_index) filters.bed_index = values.bed_index;
        if (values.sensor_id) filters.sensor_id = values.sensor_id;
        if (values.measurement) filters.measurement = values.measurement;
        
        // Handle date range
        if (values.dateRange && values.dateRange.length === 2) {
            filters.timestamp_start = values.dateRange[0].toISOString();
            filters.timestamp_end = values.dateRange[1].toISOString();
        }
        
        // Use limit value from form or current state
        const searchLimit = values.limit || limit;
        setLimit(searchLimit);
        setOffset(0); // Reset offset when searching
        
        fetchObservations(filters, searchLimit, 0);
        setPagination({ ...pagination, current: 1 });
    };

    // Clear filters and reload all data
    const handleClear = () => {
        form.resetFields();
        setLimit(10); // Reset to default limit
        setOffset(0); // Reset offset
        fetchObservations({}, 10, 0);
        setPagination({ ...pagination, current: 1 });
    };

    // Export data to CSV
    const handleExport = () => {
        if (observations.length === 0) return;
        
        const headers = ['Observation ID', 'Experiment ID', 'Bed Index', 'Sensor ID', 'Timestamp', 'Measurement', 'Value', 'Units'];
        const csvContent = [
            headers.join(','),
            ...observations.map(obs => [
                obs.obs_id,
                obs.exp_id,
                obs.bed_index,
                obs.sensor_id,
                obs.timestamp,
                `"${obs.measurement}"`,
                obs.value,
                `"${obs.units}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sensor_observations_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Obs ID',
            dataIndex: 'obs_id',
            key: 'obs_id',
            width: isMobile ? 60 : 80,
            sorter: (a, b) => a.obs_id - b.obs_id,
            render: (value) => <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{value}</span>
        },
        {
            title: 'Exp ID',
            dataIndex: 'exp_id',
            key: 'exp_id',
            width: isMobile ? 60 : 80,
            sorter: (a, b) => a.exp_id - b.exp_id,
            render: (value) => <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{value}</span>
        },
        {
            title: 'Bed Index',
            dataIndex: 'bed_index',
            key: 'bed_index',
            width: isMobile ? 60 : 80,
            sorter: (a, b) => a.bed_index - b.bed_index,
            render: (value) => <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{value}</span>
        },
        {
            title: 'Sensor ID',
            dataIndex: 'sensor_id',
            key: 'sensor_id',
            width: isMobile ? 70 : 100,
            sorter: (a, b) => a.sensor_id - b.sensor_id,
            render: (value) => <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{value}</span>
        },
        {
            title: isMobile ? 'Time' : 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: isMobile ? 100 : 180,
            render: (timestamp) => (
                <span style={{ fontSize: isMobile ? '11px' : '14px' }}>
                    {dayjs(timestamp).format(isMobile ? 'MM/DD HH:mm' : 'YYYY-MM-DD HH:mm:ss')}
                </span>
            ),
            sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
        },
        {
            title: 'Measurement',
            dataIndex: 'measurement',
            key: 'measurement',
            width: isMobile ? 100 : 150,
            render: (measurement) => (
                <Tag color="blue" size={isMobile ? 'small' : 'default'}>
                    {measurement}
                </Tag>
            ),
            filters: [...new Set(observations.map(obs => obs.measurement))].map(measurement => ({
                text: measurement,
                value: measurement,
            })),
            onFilter: (value, record) => record.measurement.includes(value),
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            width: isMobile ? 70 : 100,
            align: 'right',
            render: (value) => (
                <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
            ),
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: 'Units',
            dataIndex: 'units',
            key: 'units',
            width: isMobile ? 60 : 100,
            render: (units) => (
                <Tag color="orange" size={isMobile ? 'small' : 'default'}>
                    {units}
                </Tag>
            ),
        },
    ];

    // Calculate statistics
    const stats = {
        total: observations.length,
        uniqueSensors: new Set(observations.map(obs => obs.sensor_id)).size,
        uniqueExperiments: new Set(observations.map(obs => obs.exp_id)).size,
        uniqueBeds: new Set(observations.map(obs => obs.bed_index)).size,
        dateRange: observations.length > 0 ? {
            earliest: dayjs.min(observations.map(obs => dayjs(obs.timestamp))),
            latest: dayjs.max(observations.map(obs => dayjs(obs.timestamp)))
        } : null
    };

    return (
        <div style={{ 
            padding: isMobile ? '12px' : isTablet ? '16px' : '24px', 
            backgroundColor: '#000', 
            minHeight: '100vh' 
        }}>
            <Title 
                level={isMobile ? 3 : 2} 
                style={{ 
                    color: 'yellow', 
                    marginBottom: isMobile ? '16px' : '24px',
                    fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
                    textAlign: isMobile ? 'center' : 'left'
                }}
            >
                Sensor Observations
            </Title>

            {/* Statistics Cards */}
            <Row gutter={[8, 8]} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Card size={isMobile ? 'small' : 'default'}>
                        <Statistic 
                            title="Total Observations" 
                            value={stats.total} 
                            valueStyle={{ 
                                color: 'white',
                                fontSize: isMobile ? '16px' : '20px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Card size={isMobile ? 'small' : 'default'}>
                        <Statistic 
                            title="Unique Experiments" 
                            value={stats.uniqueExperiments} 
                            valueStyle={{ 
                                color: 'white',
                                fontSize: isMobile ? '16px' : '20px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Card size={isMobile ? 'small' : 'default'}>
                        <Statistic 
                            title="Unique Beds" 
                            value={stats.uniqueBeds} 
                            valueStyle={{ 
                                color: 'white',
                                fontSize: isMobile ? '16px' : '20px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={6} lg={6}>
                    <Card size={isMobile ? 'small' : 'default'}>
                        <Statistic 
                            title="Unique Sensors" 
                            value={stats.uniqueSensors} 
                            valueStyle={{ 
                                color: 'white',
                                fontSize: isMobile ? '16px' : '20px'
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Date Range Card */}
            <Row gutter={16} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <Col span={24}>
                    <Card size={isMobile ? 'small' : 'default'}>
                        <Statistic 
                            title="Date Range" 
                            value={stats.dateRange ? 
                                `${stats.dateRange.earliest.format(isMobile ? 'MM/DD/YY' : 'MM/DD/YYYY')} - ${stats.dateRange.latest.format(isMobile ? 'MM/DD/YY' : 'MM/DD/YYYY')}` : 
                                'No data'
                            }
                            valueStyle={{ 
                                color: 'white', 
                                fontSize: isMobile ? '14px' : '16px' 
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filter Form */}
            <Card 
                title="Filters" 
                style={{ marginBottom: isMobile ? '16px' : '24px' }}
                size={isMobile ? 'small' : 'default'}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSearch}
                >
                    <Row gutter={[8, 8]}>
                        <Col xs={12} sm={8} md={4} lg={5}>
                            <Form.Item label="Experiment ID" name="exp_id">
                                <InputNumber 
                                    placeholder="Exp ID"
                                    style={{ width: '100%' }}
                                    min={1}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8} md={4} lg={4}>
                            <Form.Item label="Bed Index" name="bed_index">
                                <InputNumber 
                                    placeholder="Bed Index (0-7)"
                                    style={{ width: '100%' }}
                                    min={0}
                                    max={7}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8} md={4} lg={4}>
                            <Form.Item label="Sensor ID" name="sensor_id">
                                <InputNumber 
                                    placeholder="Sensor ID"
                                    style={{ width: '100%' }}
                                    min={1}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8} md={4} lg={5}>
                            <Form.Item label="Observation ID" name="obs_id">
                                <InputNumber 
                                    placeholder="Obs ID"
                                    style={{ width: '100%' }}
                                    min={1}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={12} sm={8} md={4} lg={4}>
                            <Form.Item label="Measurement" name="measurement">
                                <Input 
                                    placeholder="Measurement"
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                        {/* <Col xs={12} sm={8} md={4} lg={3}>
                            <Form.Item 
                                label="Limit" 
                                name="limit"
                                initialValue={limit}
                            >
                                <InputNumber 
                                    placeholder="Limit"
                                    style={{ width: '100%' }}
                                    min={1}
                                    max={1000}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col> */}
                        <Col xs={24} sm={16} md={12} lg={12}>
                            <Form.Item label="Date Range" name="dateRange">
                                <RangePicker 
                                    showTime
                                    style={{ width: '100%' }}
                                    placeholder={['Start date', 'End date']}
                                    size={isMobile ? 'small' : 'middle'}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <hr />
                    <Row gutter={[8, 8]} justify="center">
                        <Col 
                            xs={24} 
                            sm={8} 
                            md={12} 
                            lg={12} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'end', 
                                gap: '8px',
                                flexDirection: isMobile ? 'column' : 'row'
                            }}
                        >
                            <Button 
                                type="primary" 
                                icon={<SearchOutlined />}
                                htmlType="submit"
                                loading={loading}
                                size={isMobile ? 'small' : 'middle'}
                                style={{ width: isMobile ? '100%' : 'auto' }}
                            >
                                {isMobile ? 'Search' : 'Search'}
                            </Button>
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={handleClear}
                                size={isMobile ? 'small' : 'middle'}
                                style={{
                                    color : 'blue',
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {isMobile ? 'Clear' : 'Clear'}
                            </Button>
                            <Button 
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                disabled={observations.length === 0}
                                size={isMobile ? 'small' : 'middle'}
                                style={{
                                    color : observations.length === 0 ? 'gray' : 'blue',
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {isMobile ? 'Export' : 'Export CSV'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: isMobile ? '16px' : '24px' }}
                    size={isMobile ? 'small' : 'default'}
                />
            )}

            {/* Data Table */}
            <Card 
                title={`Observations (${observations.length} records)`}
                size={isMobile ? 'small' : 'default'}
            >
                <Table
                    columns={columns}
                    dataSource={observations}
                    rowKey="obs_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: !isMobile,
                        showQuickJumper: !isMobile,
                        size: isMobile ? 'small' : 'default',
                        showTotal: (total, range) => 
                            isMobile ? `${range[0]}-${range[1]}/${total}` : `${range[0]}-${range[1]} of ${total} observations`
                    }}
                    onChange={(paginationConfig, filters, sorter) => {
                        setPagination(paginationConfig);
                    }}
                    scroll={{ x: isMobile ? 580 : 800 }}
                    size="small"
                />
            </Card>
        </div>
    );
};

export default GetSensorObservations;