import React, { useRef, useEffect, useState } from "react";
import { Card, Row, Col, Typography, Divider, Space } from "antd";

const { Title, Text } = Typography;

// NWSForecast component: displays weather forecast for a location using _nws_forecast array
const NWSForecast = ({ lat, lng, locationName, forecastData }) => {
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
        return <Card><Text>No forecast data available.</Text></Card>;
    }

    // Current period (first in array)
    const current = forecastData[0];

    // get the current date as day name, month name, and day number as a string
    const currentDate = new Date(current.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });



    // Refs and state for equal card heights
    const cardRefs = useRef([]);
    const [maxHeight, setMaxHeight] = useState(undefined);

    useEffect(() => {
        if (cardRefs.current.length > 0) {
            const heights = cardRefs.current.map(ref => ref ? ref.offsetHeight : 0);
            setMaxHeight(Math.max(...heights));
        }
    }, [forecastData]);

    return (
        <Card style={{ marginBottom: '1em' }}>
            <Row gutter={16} align="middle">
                <Col xs={24} md={6}>
                    <div style={{ display:'block', width: '132px', marginLeft:'auto', marginRight:'auto' }}>
                        <div style={{display: 'block'}} >
                            <img
                                src={current.icon}
                                alt={current.shortForecast}
                                style={{ display: 'block', width: 128, height: 128, marginBottom: 8, marginLeft:'auto', marginRight: 'auto' }}
                             />
                        </div>
                        <div style={{ display: 'block', textAlign: 'center' }}>
                             <Title level={3} style={{ marginBottom: 0 }}>{current.temperature}&deg;{current.temperatureUnit}</Title>
                             <Text style={{ fontSize: '1.1em' }}>{current.shortForecast}</Text>
                             <br />
                             <Text>{current.windSpeed} {current.windDirection}</Text>
                             <br />
                             <Text>Precip: {current.probabilityOfPrecipitation?.value ?? 0}%</Text>
                        </div>
                    </div>
                </Col>
                <Col xs={24} md={18}>
                    <Title level={4} style={{ marginBottom: 0 }}>{locationName}</Title>
                    <Text>Forecast for {currentDate}</Text>
                    <Text>
                        { lat && lng && ( 'Lat: ' + lat.toFixed(4) + ' Lng: ' + lng.toFixed(4) ) }
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text>{current.detailedForecast}</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Space direction="horizontal" size="middle" style={{ width: '100%', overflowX: 'auto' }}>
                        {forecastData.slice(1, 7).map((period, idx) => (
                            <Card
                                key={period.number || idx}
                                size="small"
                                style={{
                                    minWidth: 120,
                                    textAlign: 'center',
                                    height: maxHeight ? maxHeight : 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start'
                                }}
                                ref={el => cardRefs.current[idx] = el}
                            >
                                <img
                                    src={period.icon}
                                    alt={period.shortForecast}
                                    style={{ width: 32, height: 32, marginBottom: 4 }}
                                />
                                <div style={{ fontWeight: 500 }}>{period.name}</div>
                                <div>{period.temperature}&deg;{period.temperatureUnit}</div>
                                <div style={{ fontSize: '0.95em' }}>{period.shortForecast}</div>
                                <div style={{ fontSize: '0.85em', color: '#888' }}>{period.windSpeed} {period.windDirection}</div>
                                <div style={{ fontSize: '0.85em', color: '#888' }}>Precip: {period.probabilityOfPrecipitation?.value ?? 0}%</div>
                            </Card>
                        ))}
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default NWSForecast;

