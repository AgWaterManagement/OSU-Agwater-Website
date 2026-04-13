import { useEffect, useRef, useState } from 'react';
import { Typography, Row, Col, Select, Spin, Alert } from 'antd';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './weather_sensors.css';

// filepath: d:\Websites\AgWaterWebsite\src\pages\weather_sensors\WeatherSensors.jsx

const { Title, Text } = Typography;
const { Option } = Select;

const WeatherSensors = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [sensors, setSensors] = useState([]);
    const [filteredSensors, setFilteredSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState(null);
    const [error, setError] = useState(null);
    const markersRef = useRef([]);

    // Fetch sensor data
    useEffect(() => {
        const fetchSensors = async () => {
            try {
                setLoading(true);
                // Replace with your actual API endpoint
                const response = await fetch('/api/weather-sensors');
                if (!response.ok) throw new Error('Failed to fetch sensors');
                const data = await response.json();
                setSensors(data);
                setFilteredSensors(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching sensors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSensors();
    }, []);

    // Initialize map
    useEffect(() => {
        if (mapContainer.current && !map.current) {
            map.current = L.map(mapContainer.current).setView([39.8283, -98.5795], 4);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map.current);
        }
    }, []);

    // Update markers when filtered sensors change
    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => map.current.removeLayer(marker));
        markersRef.current = [];

        // Add new markers
        filteredSensors.forEach(sensor => {
            if (sensor.latitude && sensor.longitude) {
                const marker = L.marker([sensor.latitude, sensor.longitude])
                    .bindPopup(
                        `<div>
                            <strong>${sensor.name}</strong><br/>
                            State: ${sensor.state}<br/>
                            Type: ${sensor.type}<br/>
                            <small>${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}</small>
                        </div>`
                    )
                    .addTo(map.current);
                markersRef.current.push(marker);
            }
        });

        // Adjust map bounds if sensors exist
        if (filteredSensors.length > 0) {
            const group = new L.featureGroup(markersRef.current);
            map.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }, [filteredSensors]);

    const handleStateChange = (state) => {
        setSelectedState(state);
        if (state) {
            setFilteredSensors(sensors.filter(s => s.state === state));
        } else {
            setFilteredSensors(sensors);
        }
    };

    const uniqueStates = [...new Set(sensors.map(s => s.state))].sort();

    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>Weather Sensors Network</Title>

            <Row gutter={16} style={{ marginBottom: '20px' }}>
                <Col xs={24} md={6}>
                    <Text strong>Filter by State:</Text>
                    <Select
                        placeholder="Select a state..."
                        allowClear
                        onChange={handleStateChange}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {uniqueStates.map(state => (
                            <Option key={state} value={state}>
                                {state}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col xs={24} md={18}>
                    <Text>
                        Showing {filteredSensors.length} sensor{filteredSensors.length !== 1 ? 's' : ''}{selectedState && ` in ${selectedState}`}
                    </Text>
                </Col>
            </Row>

            {error && (
                <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div
                    ref={mapContainer}
                    style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                    }}
                />
            )}
        </div>
    );
};

export default WeatherSensors;