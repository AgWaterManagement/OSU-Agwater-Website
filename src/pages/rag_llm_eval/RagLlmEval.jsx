import { useState, useEffect } from "react";
import { useMediaQuery } from 'react-responsive';
import PropTypes from 'prop-types';
import { 
    Table, 
    Card, 
    Input, 
    Select, 
    Button, 
    Space, 
    Tag, 
    Typography, 
    Divider, 
    Rate, 
    Tooltip,
    Modal,
    Pagination,
    Alert,
    Empty
} from "antd";
import { 
    SearchOutlined, 
    FilterOutlined, 
    EyeOutlined, 
    DownloadOutlined,
    ReloadOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

const RATINGS_PER_PAGE = 10;

const LLM_RATINGS_URL = "https://agwater.org:5556/llm/ratings"; // Default API endpoint

const RagLlmEval = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedModel, setSelectedModel] = useState("all");
    const [selectedRating, setSelectedRating] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const isMobile = useMediaQuery({ maxWidth: 768 });

    // Fetch data from API
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(LLM_RATINGS_URL, {
                method: 'GET',
                headers: {
                    "X-API-Key": "agwater-web-app",
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle the response based on the API structure
            // If the API returns an array directly
            if (Array.isArray(data)) {
                setData(data);
                setFilteredData(data);
            } 
            // If the API returns an object with a ratings array
            else if (data.ratings && Array.isArray(data.ratings)) {
                setData(data.ratings);
                setFilteredData(data.ratings);
            }
            // If the API returns an object with success flag
            else if (data.success && data.ratings) {
                setData(data.ratings);
                setFilteredData(data.ratings);
            }
            else {
                console.error("Unexpected API response format:", data);
                setData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching LLM ratings data:", error);
            setError(error.message);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Remove apiEndpoint dependency since we're using the constant LLM_RATINGS_URL

    // Filter data based on search and filters
    useEffect(() => {
        let filtered = data;

        // Apply search filter
        if (searchText) {
            filtered = filtered.filter(item =>
                item.question.toLowerCase().includes(searchText.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchText.toLowerCase()) ||
                item.comment.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Apply model filter
        if (selectedModel !== "all") {
            filtered = filtered.filter(item => item.model === selectedModel);
        }

        // Apply rating filter
        if (selectedRating !== "all") {
            filtered = filtered.filter(item => item.rating === parseInt(selectedRating));
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [data, searchText, selectedModel, selectedRating]);

    // Get unique models for filter dropdown
    const uniqueModels = [...new Set(data.map(item => item.model))];

    // Get rating color based on value
    const getRatingColor = (rating) => {
        if (rating >= 4) return 'green';
        if (rating >= 3) return 'orange';
        return 'red';
    };

    // Get paginated data
    const paginatedData = filteredData.slice(
        (currentPage - 1) * RATINGS_PER_PAGE,
        currentPage * RATINGS_PER_PAGE
    );

    // Table columns
    const columns = [
        {
            title: 'Question',
            dataIndex: 'question',
            key: 'question',
            ellipsis: true,
            width: isMobile ? 150 : 300,
            render: (text) => (
                <Tooltip title={text}>
                    <Text>{text}</Text>
                </Tooltip>
            ),
        },
        {
            title: 'Model',
            dataIndex: 'model',
            key: 'model',
            width: 120,
            render: (model) => (
                <Tag color="blue">{model}</Tag>
            ),
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 120,
            render: (rating) => (
                <Space>
                    <Rate disabled defaultValue={rating} />
                    <Tag color={getRatingColor(rating)}>{rating}/5</Tag>
                </Space>
            ),
        },
        {
            title: 'Submitted By',
            dataIndex: 'submitted_by',
            key: 'submitted_by',
            width: 150,
            render: (email) => (
                <Text code>{email}</Text>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date) => dayjs(date).format('MMM DD, YYYY'),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedRecord(record);
                        setModalVisible(true);
                    }}
                >
                    View
                </Button>
            ),
        },
    ];

    // Mobile-optimized columns
    const mobileColumns = [
        {
            title: 'Evaluation',
            key: 'evaluation',
            render: (_, record) => (
                <div>
                    <div style={{ marginBottom: 8 }}>
                        <Text strong ellipsis style={{ fontSize: 14 }}>
                            {record.question.length > 80 
                                ? `${record.question.substring(0, 80)}...` 
                                : record.question
                            }
                        </Text>
                    </div>
                    <Space wrap>
                        <Tag color="blue">{record.model}</Tag>
                        <Tag color={getRatingColor(record.rating)}>{record.rating}/5</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(record.created_at).format('MMM DD')}
                        </Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                        <Button 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedRecord(record);
                                setModalVisible(true);
                            }}
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? 16 : 24 }}>
            <Card>
                <Title level={2} style={{ marginBottom: 24 }}>
                    RAG LLM Evaluation Results
                </Title>
                
                {/* Filters and Search */}
                <div style={{ marginBottom: 24 }}>
                    <Space 
                        direction={isMobile ? "vertical" : "horizontal"} 
                        size="middle" 
                        style={{ width: '100%' }}
                    >
                        <Search
                            placeholder="Search questions, answers, or comments..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            style={{ width: isMobile ? '100%' : 300 }}
                            onSearch={setSearchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        
                        <Select
                            value={selectedModel}
                            onChange={setSelectedModel}
                            style={{ width: isMobile ? '100%' : 150 }}
                            size="large"
                        >
                            <Option value="all">All Models</Option>
                            {uniqueModels.map(model => (
                                <Option key={model} value={model}>{model}</Option>
                            ))}
                        </Select>
                        
                        <Select
                            value={selectedRating}
                            onChange={setSelectedRating}
                            style={{ width: isMobile ? '100%' : 120 }}
                            size="large"
                        >
                            <Option value="all">All Ratings</Option>
                            <Option value="5">5 Stars</Option>
                            <Option value="4">4 Stars</Option>
                            <Option value="3">3 Stars</Option>
                            <Option value="2">2 Stars</Option>
                            <Option value="1">1 Star</Option>
                        </Select>
                        
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={fetchData}
                            size="large"
                        >
                            Refresh
                        </Button>
                    </Space>
                </div>

                <Divider />

                {/* Error Display */}
                {error && (
                    <Alert
                        message="Error Loading Data"
                        description={`Failed to fetch evaluation data: ${error}`}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={
                            <Button size="small" onClick={fetchData}>
                                Retry
                            </Button>
                        }
                    />
                )}

                {/* Results Summary */}
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                        Showing {paginatedData.length} of {filteredData.length} evaluations
                        {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
                    </Text>
                </div>

                {/* Table */}
                {!loading && !error && filteredData.length === 0 ? (
                    <Empty 
                        description="No evaluation data available"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <Table
                        columns={isMobile ? mobileColumns : columns}
                        dataSource={paginatedData}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: isMobile ? 300 : 1000 }}
                        size={isMobile ? "small" : "middle"}
                    />
                )}

                {/* Pagination */}
                {filteredData.length > RATINGS_PER_PAGE && (
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Pagination
                            current={currentPage}
                            total={filteredData.length}
                            pageSize={RATINGS_PER_PAGE}
                            onChange={setCurrentPage}
                            showSizeChanger={false}
                            showQuickJumper
                            showTotal={(total, range) => 
                                `${range[0]}-${range[1]} of ${total} evaluations`
                            }
                        />
                    </div>
                )}
            </Card>

            {/* Detail Modal */}
            <Modal
                title="Evaluation Details"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={isMobile ? '95%' : 800}
            >
                {selectedRecord && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Question:</Text>
                            <Paragraph style={{ marginTop: 8 }}>
                                {selectedRecord.question}
                            </Paragraph>
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Answer:</Text>
                            <Paragraph style={{ marginTop: 8 }}>
                                {selectedRecord.answer}
                            </Paragraph>
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                            <Space wrap>
                                <div>
                                    <Text strong>Model: </Text>
                                    <Tag color="blue">{selectedRecord.model}</Tag>
                                </div>
                                <div>
                                    <Text strong>Rating: </Text>
                                    <Rate disabled defaultValue={selectedRecord.rating} />
                                    <Tag color={getRatingColor(selectedRecord.rating)}>
                                        {selectedRecord.rating}/5
                                    </Tag>
                                </div>
                            </Space>
                        </div>
                        
                        {selectedRecord.comment && (
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>Comment:</Text>
                                <Paragraph style={{ marginTop: 8 }}>
                                    {selectedRecord.comment}
                                </Paragraph>
                            </div>
                        )}
                        
                        <div style={{ marginBottom: 16 }}>
                            <Space wrap>
                                <div>
                                    <Text strong>Submitted by: </Text>
                                    <Text code>{selectedRecord.submitted_by}</Text>
                                </div>
                                <div>
                                    <Text strong>Date: </Text>
                                    <Text>{dayjs(selectedRecord.created_at).format('MMMM DD, YYYY HH:mm')}</Text>
                                </div>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

RagLlmEval.propTypes = {
    apiEndpoint: PropTypes.string,
};

export default RagLlmEval;
