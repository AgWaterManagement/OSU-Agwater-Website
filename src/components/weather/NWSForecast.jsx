import { useRef, useEffect, useState } from "react";
import { Badge, Calendar, Card, Row, Col, Typography, Divider } from "antd";

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import minMax from 'dayjs/plugin/minMax';
dayjs.extend(minMax);
dayjs.extend(isSameOrAfter);

import { ResponsiveContainer, LineChart, BarChart, Line, Bar, LabelList, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, Legend, Text as ReText, ComposedChart } from 'recharts';

const { Title, Text } = Typography;

import { secrets } from "../../secrets";
import { color } from "d3";


//import MOSTLY_SUNNY from  '/images/nws_forecast/icon_0_0.png';
//import PARTLY_CLOUDY from '/images/nws_forecast/icon_0_1.png';
//import MOSTLY_CLOUDY from '/images/nws_forecast/icon_0_2.png';
//import PARTLY_SUNNY  from '/images/nws_forecast/icon_0_0.png';


const SUNNY = '/images/nws_forecast/icon_0_0.png';
const PARTLY_CLOUDY = '/images/nws_forecast/icon_0_1.png';
const MOSTLY_CLOUDY = '/images/nws_forecast/icon_0_2.png';
const PARTLY_SUNNY = '/images/nws_forecast/icon_0_0.png';

const MOSTLY_CLEAR = '/images/nws_forecast/icon_2_4.png';

const CLOUDY = '/images/nws_forecast/icon_0_3.png';
const LIGHT_RAIN = '/images/nws_forecast/icon_0_4.png';
const RAIN = '/images/nws_forecast/icon_1_0.png';
const HEAVY_RAIN = '/images/nws_forecast/icon_1_1.png';
const THUNDERSTORMS = '/images/nws_forecast/icon_1_2.png';







// NWSForecast component: displays weather forecast for a location using _nws_forecast array
const NWSForecast = ({ lat, lng, locationName, forecastData: propForecastData,
    showTemperatureChart = true, showPrecipitationChart = true, showETChart = true,

 }) => {

    const [forecastData, setForecastData] = useState(propForecastData || []);
    const [etForecastData, setEtForecastData] = useState([]);
    const [displayMode, setDisplayMode] = useState('scroll'); // 'scroll' or 'calendar'

    // Refs and state for equal card heights - must be declared before early return
    const cardRefs = useRef([]);
    const [maxHeight, setMaxHeight] = useState(undefined);

    // Fetch NWS forecast when component mounts or when lat/lng changes
    useEffect(() => {
        if (!lat || !lng) {
            return;
        }

        const fetchForecast = async () => {
            try {
                const response = await fetch(`https://agwater.org:5556/agrimet/nws_forecast?latitude=${lat}&longitude=${lng}`,
                    {
                        method: 'GET',
                        headers: {
                            "X-API-Key": secrets.agwater_api_key
                        }
                    }
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch forecast: ${response.status}`);
                }
                const data = await response.json();
                if (data.success && data.forecast && data.forecast.properties && data.forecast.properties.periods) {
                    setForecastData(data.forecast.properties.periods);
                }
            } catch (error) {
                console.error('Error fetching NWS forecast:', error);
            }
        };

        fetchForecast();
    }, [lat, lng]);

    useEffect(() => {
        if (!lat || !lng) {
            return;
        }

        const fetchEtForecast = async () => {
            try {
                const response = await fetch(
                    `https://agwater.org:5556/fms/userfield/weather/forecast/?lat=${lat}&long=${lng}`,
                    {
                        method: 'GET',
                        headers: {
                            'X-API-Key': secrets.agwater_api_key
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch ET forecast:', response.status, await response.text());
                    throw new Error(`Failed to fetch ET forecast: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched ET forecast data:', data);
                setEtForecastData(data?.data ?? data?.forecast ?? data?.forecasts ?? data ?? []);
            } catch (error) {
                console.error('Error fetching ET forecast:', error);
                setEtForecastData([]);
            }
        };


        const fetchEtForecastV2 = async () => {
            try {
                const response = await fetch(
                    `https://agwater.org:5556/fms/userfield/weather/forecast/v2?lat=${lat}&long=${lng}`,
                    {
                        method: 'GET',
                        headers: {
                            'X-API-Key': secrets.agwater_api_key
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch ET forecast:', response.status, await response.text());
                    throw new Error(`Failed to fetch ET forecast: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched ET forecast data:', data);
                setEtForecastData(data?.data ?? null);
            } catch (error) {
                console.error('Error fetching ET forecast:', error);
                setEtForecastData([]);
            }
        };


        fetchEtForecastV2();
    }, [lat, lng]);

    // Set equal card heights
    useEffect(() => {
        if (cardRefs.current.length > 0) {
            const heights = cardRefs.current.map(ref => ref ? ref.offsetHeight : 0);
            setMaxHeight(Math.max(...heights));
        }
    }, [forecastData]);

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


    // Horizontally scrollable list of forecast items
    const createCalendarScroll = () => {
        if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) return null;

        const start = dayjs(); // 
        // array of day.js value for the next seven days
        const days = Array.from({ length: 7 }).map((_, i) => start.add(i, 'day'));

        function zeroPad(num, places) {
            const zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        }

        const cardWidth = 148; // must match the minWidth in the card style below

        return (
            /* Outer container div for the calendar - this will contain the horizontally scrollable calendar row and the forecast charts below it */
            <div style={{
                display: 'flex', flexDirection: 'column', flexWrap: 'nowrap',
                justifyContent: 'center', alignItems: 'center',
                overflow: 'hidden',
                width: '100%', height:'1200',
                backgroundColor: '#f9f9f9', padding: 0, margin: 0, borderRadius: 2
            }}>
               
                <div style={{overflowX: 'auto', width: '100%'}}>
                    {/* Calendar row container for the daily forecasts - this should scroll within the parent div  */}
                    <div style={{ display: 'flex', width: (cardWidth+8)* 7, justifyContent: 'center', alignItems: 'center',
                         gap: 8, padding: '0 0' }}>

                    {/* Make individual calendar day containers next for the daily forecasts  */}
                    {days.map((day, i) => {
                        const forecasts = getForecasts(day, forecastData);
                        //console.log('Calendar date:', day.format('YYYY-MM-DD'), 'Forecasts for this date:', forecasts);

                        let dayForecast = null;
                        let nightForecast = null;
                        for (let i = 0; i < forecasts.length; i++) {
                            const period = forecasts[i];
                            if (period.isDaytime)
                                dayForecast = period;
                            else
                                nightForecast = period;
                        }

                        const forecastImage = getForecastImage(dayForecast);

                        const dayOfMonth = zeroPad(day.date(), 2);
                        const dayOfWeek = day.format('ddd');
                        const bkgrColor = forecasts.length > 0 ? '#eee' : '#fff';

                        return (
                            <>
                                <div key={'day_' + i} style={{
                                    minWidth: cardWidth,
                                    display: 'inline-block',
                                    //flex: '0 0 auto',
                                    color: '#333',
                                    background: '#fff',
                                    padding: 8,
                                    borderRadius: 6,
                                    textAlign: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}>
                                    {/* day of week and day of month number */}
                                    <span style={{ float: 'left', textAlign: 'left', width: '50%', fontSize: '1.1em', fontWeight: 500, marginBottom: 0 }}>
                                        {dayOfWeek}
                                    </span>
                                    <span style={{ float: 'right', textAlign: 'right', width: '50%', fontSize: '1.1em', fontWeight: 500, marginBottom: 0 }}>
                                        {dayOfMonth}
                                    </span>

                                    <div style={{
                                        border: '1px solid #fff',
                                        borderRadius: 2,
                                        marginTop: '1.6em',
                                        padding: 2,
                                        textAlign: 'right',
                                        color: 'black',
                                        background: 'white',
                                        width: '100%',
                                    }}>
                                    </div>

                                    {/* content panel - forecast data for the day */}
                                    <div style={{
                                        backgroundColor: bkgrColor,
                                        marginTop: 0,
                                        borderRadius: 2,
                                        padding: 0,
                                        backgroundImage: 'url(' + forecastImage + ')',
                                        backgroundSize: '8em 8em',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: '80% 50%',
                                        backgroundOrigin: 'content-box',
                                        height: '8em',
                                    }}
                                    > <>
                                        {dayForecast && (
                                            <>
                                                <div style={{
                                                    margin: 0, marginBottom: '0em', borderRadius: 2, padding: 0,
                                                    textAlign: 'right', color: 'black',
                                                    width: '100%', height: '100%',
                                                }} >
                                                    <span style={{
                                                        display: 'block', color: 'black', textAlign: 'right',
                                                        marginTop: 0, marginBottom: 0,
                                                        borderRadius: 2, padding: 0,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                                        fontSize: '2.5em'
                                                    }} >
                                                        {dayForecast.temperature}&deg;
                                                    </span>

<br/>
                                                    <span style={{
                                                        marginTop: '2em', borderRadius: 2, padding: 0,
                                                         color: 'black', textAlign: 'left',
                                                        fontSize: '1.5em', width: '100%', 
                                                    }} >
                                                    {nightForecast.temperature}&deg;
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        </>
                                    </div>
                                        <div style={{ 
                                            color: 'black', 
                                            marginTop: '0.5em',
                                            marginBottom: '0.5em',
                                            height: '3em'}}>
                                                {dayForecast ? dayForecast.shortForecast : ''}
                                        </div>

                                </div>
                            </>
                        )}
                    )}
                    </div>

                    <div style={{ display: 'flex', width: (cardWidth+8)* 7, justifyContent: 'center', alignItems: 'center',  gap: 8, padding: '8px 0', paddingBottom: '4px' }}>
                        {createForecastCharts()}
                    </div>
                </div>
            </div>
        );

    };

    // Return all forecast periods that cover the supplied day.
    const getForecasts = (day, _forecastData) => {
        if (!day || !Array.isArray(_forecastData)) {
            return [];
        }

        return _forecastData.filter((period) => {
            const periodStart = dayjs(period.startTime);
            const periodEnd = dayjs(period.endTime);

            if (day.isBefore(periodStart, 'day') || day.isAfter(periodEnd, 'day')) {
                //console.log('Date', day.format('YYYY-MM-DD'), 'is outside the period', period.name, 'which runs from', periodStart.format('YYYY-MM-DD'), 'to', periodEnd.format('YYYY-MM-DD'));
                return false;
            } else {
                //console.log('Date', day.format('YYYY-MM-DD'), 'is within the period', period.name, 'which runs from', periodStart.format('YYYY-MM-DD'), 'to', periodEnd.format('YYYY-MM-DD'));
                return true;
            }
        });

    };

    const createForecastCharts = () => {
        if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) return null;

        const chartData = forecastData.map((period, index) => ({
            label: period.name || `Period ${index + 1}`,
            date: dayjs(period.startTime).isValid()
                ? dayjs(period.startTime).format('ddd M/D')
                : (period.name || `Period ${index + 1}`),
            temperature: typeof period.temperature === 'number' ? period.temperature : null,
            precipitation: period.probabilityOfPrecipitation?.value ?? 0,
        }));

        const etSource = Array.isArray(etForecastData)
            ? etForecastData
            : [];

        const etChartData = Array.isArray(etSource)
            ? etSource.map((period) => {
                //const time = period.time;
                //const et = period.eto ? period.eto : 0;
                //const parsedDate = dayjs(time);
                //const label = parsedDate.isValid() ? parsedDate.format('ddd M/D') : String(time);
                const label = period['Date'];
                const et = period['eto (mm)'] || 0;
                    
                return {
                    date: label,
                    et: Number(et) || 0, // Use the 'eto' value if it's a valid number, otherwise default to 0
                };
            })
            : [];

        const chartHeight = 120;

        const createPointLabel = (data) => {
            return ({ x, y, value, index }) => {
                if (value === null || value === undefined || Number.isNaN(value)) {
                    return null;
                }

                const dateValue = data[index]?.date || data[index]?.label || '';
                const textValue = typeof value === 'number'
                    ? (Number.isInteger(value) ? `${value}` : value.toFixed(2))
                    : String(value);

                const paddingX = 4;
                const rectHeight = 30;
                const rectWidth = Math.max(42, Math.max(dateValue.length, textValue.length) * 7 + paddingX * 2);
                const yOffset = 0;
                return (
                    <g transform={`translate(${x - rectWidth / 2},${y - rectHeight - yOffset})`}>
                        <rect
                            width={rectWidth}
                            height={rectHeight}
                            rx={2}
                            ry={2}
                            fill="rgba(255, 255, 255, 0.14)"
                            stroke="none"
                        />
                        <text
                            x={rectWidth / 2}
                            y={12}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={500}
                            fill="#000"
                        >
                            <tspan x={rectWidth / 2} dy="0">{dateValue}</tspan>
                            <tspan x={rectWidth / 2} dy="12">{textValue}</tspan>
                        </text>
                    </g>
                );
            };
        };

        const ChartContainer = ({ chartData, datakey, chartType, color, backgroundColor, label, source, y='60%', domain=null }) => {
            const backgroundGradient = 'linear-gradient(135deg,rgba(255, 255, 255, 1) 0%, ' + backgroundColor + ' 100%)';
            //console.log('Rendering chart with data:', chartData, 'datakey:', datakey, 'chartType:', chartType, 'color:', color, 'label:', label, 'source:', source);
            const y2 = '' + (parseInt(y.split('%')[0])+15) + '%';
            let domain2 = domain || [Math.min(...chartData.map(d => d[datakey])), Math.max(...chartData.map(d => d[datakey]))];
            const pointLabelRenderer = createPointLabel(chartData);


            return (
                <div style={{
                    width: '100%', height: chartHeight, borderRadius: 6,
                    padding: 4, paddingBottom: 0, paddingTop: 0, marginBottom: 0,
                    background: backgroundGradient
                }}>
                    <ResponsiveContainer width="100%" height={chartHeight} key={label}>
                        <ComposedChart data={chartData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <YAxis domain={domain2} stroke={color} />

                        { chartType === 'line' && (
                            <Line
                                type="monotone"
                                dataKey={datakey}
                                name={label}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                            >
                                <LabelList dataKey={datakey} content={pointLabelRenderer} />
                            </Line>
                            )}

                        { chartType === 'bar' && (
                            <Bar
                                dataKey={datakey}
                                name={label}
                                fill={color}
                            >
                                <LabelList dataKey={datakey} content={pointLabelRenderer} />
                            </Bar>
                            )}

                            <text
                                x='8%'
                                y={y}
                                style={{ fontSize: 20, fontWeight: 'bold', fill: 'rgba(0, 0, 0, 0.7)' }}
                                width={200}
                                textAnchor='left'
                            >
                                {label}
                            </text>
                            <text
                                x='8%'
                                y={y2}
                                style={{ fontSize: 12, fill: 'rgba(0,0,0,0.7)' }}
                                width={200}
                                textAnchor='left'
                            >
                                {source}
                            </text>

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )
        };


        return (
            <div style={{ width: '100%', marginBottom: 12 }}>
                {/* Temperature chart */}

                <ChartContainer
                    key="TempChart"
                    chartData={chartData}
                    domain={[25,100]}
                    datakey="temperature"
                    chartType="line"
                    color="#ff0c0c"
                    backgroundColor="#ff7f0e"
                    label="Temperature (&deg;F)"
                    source=""
                    y='90%'
                />

                { /* Precipitation chart */}
                <ChartContainer
                    key="PrecipChart"
                    chartData={chartData}
                    domain={[0, 100]}
                    datakey="precipitation"
                    chartType="bar"
                    color="#1f77b4"
                    backgroundColor="#1f77b4"
                    label="Precipitation Probability (%)"
                    source=""
                    y='20%'
                />

                { /* ET  chart */}
                {etChartData.length > 0 && (
                    <ChartContainer
                        key="ETChart"
                        chartData={etChartData}
                        domain={[0, 8]}
                        datakey="et"
                        chartType="bar"
                        color="#71baef"
                        backgroundColor="#52c41a"
                        label="ET Forecast (inches)"
                        source=""
                        y='90%'
                    />
                )}
                <br/>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>
                Sources: Temperature, Precipitation - 
                
                <a style={{color: '#043461'}} href={`https://agwater.org:5556/agrimet/nws_forecast?latitude=${lat}&longitude=${lng}`} target="_blank" rel="noopener noreferrer">
                    National Weather Service (via the agwater API)
                </a>; ET - <a style={{color: '#043461'}}
                 href={`https://agwater.org:5556/fms/userfield/weather/forecast?lat=${lat}&long=${lng}`} target="_blank" rel="noopener noreferrer">
                    OpenET (via the agwater API)
                </a>
                </span>

            </div>
    );
    }

    const getForecastImage = (forecast) => {

        if (!forecast) return null;

        const f = forecast.shortForecast;

        const rain = f.includes('Rain') || f.includes('Showers');
        const light = f.includes('Light') || f.includes('Drizzle');
        const thunder = f.includes('Thunder');
        const sunny = f.includes('Sunny') || f.includes('Clear');
        const mostly = f.includes('Mostly');
        const partly = f.includes('Partly');
        const heavy = f.includes('Heavy');
        const cloudy = f.includes('Cloudy') || f.includes('Clouds') || f.includes('Overcast');

        if (sunny) return SUNNY;
        if(mostly && sunny) return SUNNY;

        if(partly && sunny) return PARTLY_SUNNY;

        if(cloudy) return CLOUDY;

        if(light && rain) return LIGHT_RAIN;

        if (heavy && rain) return HEAVY_RAIN;

        if(rain) return RAIN;

        if(thunder) return THUNDERSTORMS;

        // Implementation for getting forecast image
        return forecast.icon || null;
    };


    const createCalendarTable = () => {
        const start = dayjs(); // today
        const weeks = [0, 1];
        const headerDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        // get the sunday before the start date to align the calendar to weeks starting on Sunday
        const startSunday = start.startOf('week'); // dayjs().startOf('week') gives the Sunday of the current week

        function zeroPad(num, places) {
            const zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        }

        return (

            <div style={{ width: '100%', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 2 }}>
                {/* Header row with day names */}
                <Row gutter={0} style={{ marginBottom: 0 }}>
                    {headerDays.map((d, i) => (
                        <Col key={`hdr_${i}`} style={{ width: `${100 / 7}%`, padding: 4 }}>
                            {i == 0 ? (
                                <>
                                    <span style={{ textAlign: 'left', fontWeight: 600, color: '#4f4f4f', width: '50%' }}>{start.format('MMM')}</span>

                                    <span style={{ textAlign: 'right', fontWeight: 600, color: '#4f4f4f', width: '50%', float: 'right' }}>{d}</span>
                                </>
                            ) : (
                                <div style={{ textAlign: 'right', fontWeight: 600, color: '#4f4f4f', width: '100%' }}>{d}</div>
                            )}
                        </Col>
                    ))}
                </Row>

                {weeks.map((week) => (
                    <Row key={`week_${week}`} gutter={2} style={{ marginBottom: 8 }}>
                        {Array.from({ length: 7 }).map((_, d) => {
                            const idx = week * 7 + d;
                            const calendarDate = startSunday.add(idx, 'day');

                            const forecasts = getForecasts(calendarDate, forecastData);
                            //console.log('Calendar date:', calendarDate.format('YYYY-MM-DD'), 'Forecasts for this date:', forecasts);

                            // pick a day and night forecast from the periods in the forecast data for this date, if they exist
                            let dayForecast = null;
                            let nightForecast = null;
                            for (let i = 0; i < forecasts.length; i++) {
                                const period = forecasts[i];
                                if (period.isDaytime)
                                    dayForecast = period;
                                else
                                    nightForecast = period;
                            }

                            const forecastImage = getForecastImage(dayForecast);

                            //const _forecastImage = MOSTLY_SUNNY;

                            const day = zeroPad(calendarDate.date(), 2);
                            const bkgrColor = forecasts.length > 0 ? '#eee' : '#fff';
                            return (
                                <Col key={`day_${idx}`} style={{ width: `${100 / 7}%`, padding: 4, borderTop: '1px solid #ccc' }}>
                                    <div style={{
                                        border: '1px solid #fff',
                                        borderRadius: 2,
                                        padding: 2,
                                        textAlign: 'right',
                                        color: 'black',
                                        background: 'white',
                                    }}>
                                        {/* day number */}
                                        <div style={{ color: '#777', backgroundColor: 'white', fontSize: '1.1em', fontWeight: 500, marginBottom: 0 }}>{day}</div>
                                    </div>

                                    {/* content panel - forecast data for the day */}
                                    <div style={{
                                        backgroundColor: bkgrColor,
                                        marginTop: 0,
                                        borderRadius: 2,
                                        padding: 0,
                                        backgroundImage: 'url(' + forecastImage + ')',
                                        backgroundSize: '6em 6em',
                                        backgroundPosition: 'center',
                                        height: '8em',
                                    }}
                                    > <>
                                            {dayForecast && (<>
                                                <div style={{
                                                    margin: 0, marginBottom: '0em', borderRadius: 2, padding: 0,
                                                    textAlign: 'right', color: 'black',
                                                    width: '100%', height: '100%',
                                                }} >

                                                    <span style={{
                                                        display: 'block', color: 'black', textAlign: 'right',
                                                        marginTop: 0, marginBottom: 0,
                                                        borderRadius: 2, padding: 0,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                                        fontSize: '2.5em'
                                                    }} >
                                                        {dayForecast.temperature}&deg;
                                                    </span>
                                                </div>
                                            </>

                                            )}

                                        </>
                                    </div>

                                    <div style={{ color: 'black', height: '3em' }}>{dayForecast ? dayForecast.shortForecast : ''}
                                    </div>

                                    {nightForecast && (
                                        <>
                                            <span style={{
                                                marginTop: '0em', borderRadius: 2, padding: 0,
                                                backgroundColor: '#aaa',
                                                display: 'block', color: 'black', textAlign: 'left',
                                                fontSize: '1.5em', width: '100%', height: '4em',
                                            }} >
                                                {nightForecast.temperature}&deg;
                                            </span>
                                        </>
                                    )}
                                </Col>
                            );
                        })}
                    </Row>
                ))}
            </div>
        );
    }




    return (
        <Card style={{ marginBottom: '1em' }}>
            <Row gutter={16} align="middle">
                <Col xs={24} md={24}>
                    <Title level={4} style={{ marginBottom: 0 }}>{locationName}</Title>
                    <Text>Forecast for {currentDate} 
                        {lat && lng && (', Latitude: ' + lat.toFixed(3) + '° ' + ' Longitude: ' + lng.toFixed(3) + '°'  )}
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text>{current.detailedForecast}</Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row gutter={[16, 16]} style={{ width: '100%' }}>

                        {displayMode === 'scroll' && createCalendarScroll()}

                        {displayMode === 'calendar' && createCalendarTable()}

                        {displayMode === 'list' && (
                            forecastData.slice(1).map((period, idx) => (
                                idx % 2 === 0 &&
                                (
                                    <Col key={period.number || idx} xs={24} sm={12} md={6} lg={4}>
                                        <Card
                                            size="small"
                                            style={{
                                                width: '100%',
                                                textAlign: 'center',
                                                backgroundColor: 'black',
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
                                                style={{ width: 64, height: 64, marginBottom: 4, alignSelf: 'center' }}
                                            />
                                            <div style={{ fontWeight: 500 }}>{period.name}</div>
                                            <div>{period.temperature}&deg;{period.temperatureUnit}</div>
                                            <div style={{ fontSize: '0.95em' }}>{period.shortForecast}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>{period.windSpeed} {period.windDirection}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>Precip: {period.probabilityOfPrecipitation?.value ?? 0}%</div>

                                            <Divider></Divider>

                                            <img
                                                src={forecastData[idx + 1]?.icon}
                                                alt={forecastData[idx + 1]?.shortForecast}
                                                style={{ width: 64, height: 64, marginBottom: 4, alignSelf: 'center' }}
                                            />
                                            <div style={{ fontWeight: 500 }}>{forecastData[idx + 1]?.name}</div>
                                            <div>{forecastData[idx + 1]?.temperature}&deg;{forecastData[idx + 1]?.temperatureUnit}</div>
                                            <div style={{ fontSize: '0.95em' }}>{forecastData[idx + 1]?.shortForecast}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>{forecastData[idx + 1]?.windSpeed} {forecastData[idx + 1]?.windDirection}</div>
                                            <div style={{ fontSize: '0.85em', color: '#888' }}>Precip: {forecastData[idx + 1]?.probabilityOfPrecipitation?.value ?? 0}%</div>

                                        </Card>
                                    </Col>
                                )
                            ))
                        )}

                    </Row>
                </Col>
            </Row>
        </Card>
    );
};

export default NWSForecast;

