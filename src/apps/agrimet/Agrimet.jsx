import { useState, useRef, useEffect } from "react";
import { Row, Col, Button, Form, Typography, Select, Table, Divider, Cascader, Collapse, Modal, message, Tabs } from "antd";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { secrets } from "../../secrets";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

import StationInfo from "./StationInfo";
import CropWaterUseChart from "./CropWaterUseChart";

import NWSForecast from "../../components/weather/NWSForecast";

//import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import Loading from "../../components/loading/Loading";

import stationData from "./usbr_map.json";

const { Title, Text } = Typography;

// Color mapping for each 'type' property
const typeColorMap = {
    "AGRIMET": "blue",
    "COAGMET": "green",
    "HYDROMET": "red",
    "METEOROLOGICAL": "orange",
    // Add more mappings as needed based on your data
    "default": "gray"
};

// Cookie helpers
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Find the name of the selected station by looking up selectedStation in stationData.features
const getSelectedStationName = (stationId) => {
    const feature = stationData.features.find(f => f.properties.siteid === stationId);
    return feature ? feature.properties.title : null;
};


// Find the name of the selected crop by looking up selectedCrop in stationData.features
//const getSelectedStationName = (stationId) => {
//    const feature = stationData.features.find(f => f.properties.siteid === stationId);
//    return feature ? feature.properties.title : null;
//};
const getStationLatLong = (stationId) => {
    const feature = stationData.features.find(f => f.properties.siteid === stationId);
    if (feature) {
        const [longitude, latitude] = feature.geometry.coordinates;
        return { lat: latitude, lng: longitude };
    } else {
        console.error(`Station ${stationId} not found in station data.`);
        return { lat: 0, lng: 0 }; // Default to 0,0 if not found
    }
};


const Agrimet = () => {

    // State to hold fetched station data
    const [loading, setLoading] = useState(false);

    // Load initial station/crop from cookie if available
    const [selectedStation, setSelectedStation] = useState(() => getCookie('agrimet_station') || 'crvo');
    const [selectedCrop, setSelectedCrop] = useState(() => getCookie('agrimet_crop') || 'WGRN');
    const [selectedState, setSelectedState] = useState(() => getCookie('agrimet_state') || 'OR');
    const [selectedStationData, setSelectedStationData] = useState(null);
    const [cropCurveModalOpen, setCropCurveModalOpen] = useState(false);
    const [selectedCurveCrop, setSelectedCurveCrop] = useState(null);
    const [cropCoefficients, setCropCoefficients] = useState({});
    const [selectedCoefficientCrop, setSelectedCoefficientCrop] = useState('ALFP');
    const [showMap, setShowMap] = useState(false); // State to control map visibility }
    const [selectedTab, setSelectedTab] = useState('1'); // Track selected tab
    const [showCoefficientTable, setShowCoefficientTable] = useState(false); // State to toggle coefficient table
    const [userLocation, setUserLocation] = useState(getStationLatLong(selectedStation));  // from geolocation
    const [cropETData, setCropETData] = useState({}); // Store crop ET data

    const selectedCropName = useRef(() => ''); // Store the name of the selected crop
    const selectedStationName = useRef(getSelectedStationName(selectedStation)); // Store the name of the selected station

    //const dates = useRef([]);           // list of dates for the selected station's observations, e.g. ['2025-07-01', '2025-07-02', ...]
    //const crops = useRef({});           // list of crops for the selected station, e.g. { 'WGRN': 'Winter Wheat', ... }
    const stationCropData = useRef([]); // station crop data (e.g. planting dates) for all crops
    const nwsForecast = useRef({}); // Store NWS forecast data
  const featureProps = useRef({});
    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];


    const fetchCropETData = async () => {
        if (!selectedStation) {
            setCropETData({});
            return;
        }

        try {
            const response = await fetch(`https://agwater.org:5556/agrimet/station/daily_et?station=${selectedStation}`, {
                headers: {
                    "X-API-Key": secrets.agwater_api_key
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch crop_et_data: ${response.status}`);
            }
            const data = await response.json();
            setCropETData(data);
            console.log('Crop ET data loaded:', data);
        } catch (error) {
            console.error('Error loading crop ET data:', error);
            setCropETData({});
        }
    };

    // Initialize: Fetch crop coefficients on component mount
    useEffect(() => {
        const fetchCropCoefficients = async () => {
            try {
                const response = await fetch('https://agwater.org:5556/json?path=agrimet&file=crop_coefficients', {
                    headers: {
                        "X-API-Key": secrets.agwater_api_key
                    }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch crop_coefficients: ${response.status}`);
                }
                const data = await response.json();
                
                Object.entries(data.data).forEach(([, crop]) => {
                    let gsi = []
                    if (crop.growth_stage_indicators) {
                        for (let i=0; i < 21; i++) {
                            if (i*10 in crop.growth_stage_indicators)
                                gsi.push(crop.growth_stage_indicators[i*10]);
                             else 
                                gsi.push(null);
                        }
                    }
                    crop.growth_stage_indicators_list = gsi;
                });
                setCropCoefficients(data.data);
                console.log('Crop coefficients loaded:', data);
            } catch (error) {
                console.error('Error loading crop coefficients:', error);
                setCropCoefficients({});
            }
        };

        fetchCropCoefficients();
        fetchCropETData();
    }, []);

    // When selectedStation is updated:
    // 1) Store station in cookie,
    // 2) update user location
    // 3) fetch crop water use data for the station
    useEffect(() => {
        setCookie('agrimet_station', selectedStation);

        selectedStationName.current = getSelectedStationName(selectedStation); // Store the name of the selected station

        // find the station lat/long for the selected station in the stationData
        const feature = stationData.features.find(f => f.properties.siteid === selectedStation);
        if (!feature) {
            console.error(`Station ${selectedStation} not found in station data.`);
            return;
        }
        const { latitude, longitude } = feature.geometry.coordinates;
        featureProps.current = feature.properties; // Store the properties of the selected station
        // Set user location to the station's coordinates
        setUserLocation({ lat: latitude, lng: longitude });

        // get the cropw water use chart data for the selected station
        fetchCropETData();

    }, [selectedStation]);

    useEffect(() => {
        //let cropCoeffChartData = getCropCoefficientChartData(selectedCrop);
        setCookie('agrimet_crop', selectedCrop);
    }, [selectedCrop]);

   
    function selectStationOptions(features) {
        const stations = {};
        let i = 0
        features.forEach((feature) => {
            const properties = feature.properties;
            if (!(properties.state in stations))
                stations[properties.state] = []; // Initialize array for the state if not already present

            stations[properties.state].push({
                key: 'station_' + i,
                value: properties.siteid,
                label: properties.title
            });
            i += 1;
        });

        const items = []
        i = 0;
        for (const state in stations) {
            items.push({
                key: 'state_' + i,
                value: state,
                label: state,
                children: stations[state]
            })
            i += 1;
        };
        return items;
    }

    const stationOptions = selectStationOptions(stationData.features); //, selectedState);

    // <Select> Crop Options
    const selectCropOptions = [];
    // iterate through stationCropData array and create options
    if (stationCropData.current && stationCropData.current.length > 0) {
        let index = 0;
        for (const crop of stationCropData.current) {
            selectCropOptions.push({
                key: index,
                value: crop.code,
                label: crop.name
            })
            index += 1;
        }
    }
    
    const updateStation = (station) => {
        const fetchSelectedStationData = async () => {
            try {
                const response = await fetch(`https://agwater.org:5556/agrimet/station_crop_info?station=${station}`, {
                    headers: {
                        "X-API-Key": secrets.agwater_api_key
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch station_crop_info for station ${station}`);
                }
                const stationJson = await response.json();

                // add a 'key' field to each crop object in the stationJson list for use in the Ant Design Table component
                //stationJson.forEach((crop, index) => {
                //    crop.key = 'stcrop_' +  index;
                //});

                setSelectedStationData(stationJson);
            } catch (error) {
                console.error("Error fetching selected station crop info", error);
                setSelectedStationData(null);
            }
        };

        fetchSelectedStationData();
        setSelectedStation(station);
    };

    const onSelectedCropChange = (value, option) => {
        selectedCropName.current = option.label; // Store the name of the selected crop
        setSelectedCrop(value);
    };

    // Geolocation: Find nearest station to user
    function getDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula
        const R = 6371000; // meters
        const pi = Math.PI;
        const phi1 = lat1 * pi / 180;
        const phi2 = lat2 * pi / 180;
        const dPhi = (lat2 - lat1) * pi / 180;
        const dLambda = (lon2 - lon1) * pi / 180;
        const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // in meters
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            message.error("Geolocation is not supported by your browser.");
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLoading(false);
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                // Find nearest station
                let minDist = Infinity;
                let nearestStation = null;
                stationData.features.forEach(feature => {
                    const coords = feature.geometry.coordinates;
                    const dist = getDistance(latitude, longitude, coords[1], coords[0]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestStation = feature.properties.siteid;
                    }
                });
                if (nearestStation) {
                    setSelectedStation(nearestStation);
                    message.success(`Nearest station selected: ${nearestStation}`);
                }
            },
            (error) => {
                setLoading(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message.error("Permission denied. Please allow location access.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message.error("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        message.error("Location request timed out.");
                        break;
                    default:
                        message.error("An unknown error occurred while fetching location.");
                        break;
                }
            }
        );
    };

    const handleToggleMap = () => {
        setShowMap(!showMap);
    }

    const openCropCurveModal = (crop) => {
        setSelectedCurveCrop(crop);
        setCropCurveModalOpen(true);
    };

    const closeCropCurveModal = () => {
        setCropCurveModalOpen(false);
        setSelectedCurveCrop(null);
    };

    const getCropCurveData = (crop) => {
        if (!crop) return [];

        const points = [];
        Object.keys(crop).forEach((key) => {
            const match = key.match(/^Daily Penman ET \(in\)(?:-(\d+))?$/);
            if (!match) return;

            const offset = match[1] ? -parseInt(match[1], 10) : 0;
            const value = Number(crop[key]);
            if (Number.isFinite(value)) {
                points.push({
                    dayOffset: offset,
                    label: offset === 0 ? 'Today' : `D${offset}`,
                    et: value,
                });
            }
        });

        return points.sort((a, b) => a.dayOffset - b.dayOffset);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#000', border: '1px solid #fff', padding: '8px' }}>
                    <p style={{ color: '#fff', margin: 0 }}>
                        {`Crop Coefficient: ${payload[0].value.toFixed(2)}`}
                    </p>
                </div>
            );
        }
        return null;
    };



    const LocationSpecificInformation = () => {
        return (
            <div>
                <p>Location-specific agricultural information and recommendations will be displayed here.</p>
            </div>
        );
    };


    const CropCoefficientsContent = () => {
        if (!cropCoefficients || typeof cropCoefficients !== 'object' || Object.keys(cropCoefficients).length === 0) {
            return (<span>No crop coefficient data available</span>);
        }

        const cropCodes = Object.keys(cropCoefficients);
        const cropOptions = cropCodes.map((code) => {
            const crop = cropCoefficients[code];
            return {
                value: code,
                label: crop.name ? `${crop.name} (${code})` : code
            };
        });

        const selectedCode = selectedCoefficientCrop !== null ? selectedCoefficientCrop : cropCodes[0];
        const selectedCrop = cropCoefficients[selectedCode];

        const getCoefficientsData = (crop) => {
            if (!crop || !crop.crop_coefficients || !Array.isArray(crop.crop_coefficients)) return [];


            let data = crop.crop_coefficients.map((value, index) => ({
                growth_stage_indicator: crop.growth_stage_indicators_list ? crop.growth_stage_indicators_list[index] : "",
                pctGrowth: index*10,
                kc: Number(value),
            }));

            data.unshift({ pctGrowth: -5, kc: null });
            data.push({ pctGrowth: 105, kc: null });
            return data;
        };

        const coeffData = selectedCrop ? getCoefficientsData(selectedCrop) : [];
        const isMobile = (typeof navigator !== 'undefined') && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const tickStep = isMobile ? 25 : 10;
        const chartTicks = coeffData.slice(1, -1).map((d) => d.pctGrowth).filter((v) => (v % tickStep) === 0);

        return (
            <>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ marginRight: '8px' }}>Select Crop:</label>
                    <Select
                        value={selectedCode}
                        onChange={setSelectedCoefficientCrop}
                        options={cropOptions}
                        style={{ width: '300px' }}
                    />
                </div>
                {selectedCrop && selectedCrop.crop_coefficients && (
                    <div>
                        <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '12px' }}>
                            {selectedCrop.description}
                        </p>
                        <div style={{ height: 320, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={coeffData}
                                    margin={{ top: 10, right: 24, left: 8, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="pctGrowth" ticks={chartTicks} stroke="yellow" style={{fontWeight: 'normal'}} height={50} label={{ stroke:'white', value: 'Percent Growth Stage (%)', position: 'insideBottom',}} />
                                    <YAxis stroke="yellow" domain={[0, 1.25]} ticks={[0, 0.25, 0.5, 0.75, 1, 1.25]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="kc" name="Crop Coefficient (Kc)" stroke="#ff7a00" strokeWidth={2} />
                                    {coeffData && coeffData.filter(d => d.growth_stage_indicator).map((d, idx) => (
                                        <ReferenceDot
                                            key={`gsi_${idx}`}
                                            x={d.pctGrowth}
                                            y={d.kc}
                                            r={9}
                                            stroke="#ff7a00"
                                            fill="yellow"
                                            label={{ position: 'bottom', value: d.growth_stage_indicator, fill: '#fff', fontSize: '12pt' }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <Button 
                                type="primary" 
                                onClick={() => setShowCoefficientTable(!showCoefficientTable)}
                                style={{ marginBottom: '16px' }}
                            >
                                {showCoefficientTable ? 'Hide' : 'Show'} Crop Coefficient Table
                            </Button>
                            {showCoefficientTable && (
                            <Table
                                dataSource={coeffData.slice(1, -1)} // Exclude the first and last entries which are for -5% and 105% growth stages
                                columns={[
                                    {
                                        title: 'Growth Stage (%)',
                                        dataIndex: 'pctGrowth',
                                        key: 'pctGrowth',
                                        align: 'center',
                                        width: '30%',
                                    },
                                    {
                                        title: 'Crop Coefficient (Kc)',
                                        dataIndex: 'kc',
                                        key: 'kc',
                                        align: 'center',
                                        width: '30%',
                                        render: (value) => value ? value.toFixed(2): null,
                                    },
                                    {
                                        title: 'Growth Stage Indicator',
                                        dataIndex: 'growth_stage_indicator',
                                        key: 'growth_stage_indicator',
                                        align: 'center',
                                        width: '40%',
                                        render: (value) => value || '',
                                    },
                                ]}
                                pagination={false}
                                size="small"
                            />
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    };

    const CropInfoTable = () => {
        if (!selectedStationData || !selectedStationData.crop_data) {
            return (<span>No crop data available</span>);
        }
        //const crop = stationCropData.current.find(c => c.code === selectedCrop);
        //if (crop == null)
        //    return (<span>No crop specified</span>);
        
        const cropData = selectedStationData.crop_data;
        // add a 'key' field to each crop object in the cropData list for use in the Ant Design Table component
        cropData.forEach((crop, index) => {
            crop.key = 'stcrop_' +  index;
        });

        const columns = [
            { title: 'Name', dataIndex: 'Name', key: 'Name' },
            { title: 'Crop Code', dataIndex: 'CropCode', key: 'CropCode', align: 'center' },
            { title: 'Start Date', dataIndex: 'Start Date', key: 'Start Date', align: 'center' },
            { title: 'Cover Date', dataIndex: 'Full Cover Date', key: 'Full Cover Date', align: 'center' },
            { title: 'Term Date', dataIndex: 'Termination Date', key: 'Termination Date', align: 'center' },
            { title: 'Sum ET (in)', dataIndex: 'Sum ET (in)', key: 'Sum ET (in)', align: 'center' },
            { title: '7-Day Use', dataIndex: '7 Day Use', key: '7 Day Use', align: 'center' },
            { title: '14-Day Use', dataIndex: '14 Day Use', key: '14 Day Use', align: 'center' },
            {
                title: 'Action',
                key: 'action',
                align: 'center',
                render: (_, record) => (
                    <Button  type='primary' onClick={() => openCropCurveModal(record)}>
                        View Curve
                    </Button>
                ),
            },
        ];

        return (
            <>
                <Table dataSource={cropData} columns={columns} />
                <Modal
                    title={`Crop Curve${selectedCurveCrop?.Name ? ` - ${selectedCurveCrop.Name}` : ''}`}
                    open={cropCurveModalOpen}
                    onCancel={closeCropCurveModal}
                    footer={null}
                    width={760}
                >
                    <div style={{ height: 320, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={getCropCurveData(selectedCurveCrop)}
                                margin={{ top: 10, right: 24, left: 8, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="et" name="Daily Penman ET (in)" stroke="#1677ff" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Modal>
            </>
        );
    };



    const resultItems = [
        {
            key: '1',
            label: 'Station Information',
            children: <StationInfo stationInfo={featureProps.current} />,
        },
        {
            key: '2',
            label: 'Current Weather Conditions',
            children:
                nwsForecast.current && nwsForecast.current.periods ? (
                    <NWSForecast
                        lat={userLocation.lat}
                        lng={userLocation.lng}
                        locationName={selectedStationName.current || selectedStation}
                        forecastData={nwsForecast.current ? nwsForecast.current.periods : []}
                    />) : (<Text>No forecast available</Text>)
        },
        {
            key: '3',
            label: 'Crop Planting, Harvest Date, and Seasonal Water Use',
            children: <CropInfoTable />,
        },
        {
            key: '4',
            label: 'Crop Water Use',
            children: <CropWaterUseChart cropETData={cropETData} />,
        },
    ];

    const tabItems = [
            {
                key: '1',
                label: 'Location-Specific Information',
                //children: <LocationSpecificInformation />,
            },
            {
                key: '2',
                label: 'Crop Coefficients',
                //children: <CropCoefficientsContent />,
            },
        ];


    return (
        <>
            {loading && <Loading tip="Loading sources..." />}

            <Title level={3} style={{ textAlign: "center", fontSize: "1.5rem" }}>
                Agrimet - Oregon
            </Title>

            <p>Below we provide access to weather and evapotranspiration data from The Bureau of Reclamation's <a href="https://www.usbr.gov/pn/agrimet/">Agrimet network</a>.
                The Agrimet network provides weather data from various stations across the Pacific Northwest, including Oregon.
                This data can help farmers and agricultural professionals make informed decisions about irrigation, crop management, and other agricultural practices.
                The page provides access to Oregon-specific Agrimet data and products.
            </p>


            <div style={{ marginLeft: '1em', marginRight: '1em', marginTop: '1em' }} >

            <Tabs items={tabItems} activeKey={selectedTab} onChange={setSelectedTab} />

            {selectedTab === '2' && (
                <div style={{ marginTop: '1em' }}>
                    <CropCoefficientsContent />
                </div>
            )}

            {selectedTab === '1' && (
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={10} style={{ height: 540 }} >
                    <Divider orientation="left">Select a Agrimet station</Divider>

                    <Cascader key='stationCascader' defaultValue={[selectedState, selectedStation]} style={{ width: '24em' }} 
                        options={stationOptions} 
                        onChange={value => {
                            const [state, station] = value;
                            setSelectedState(state);
                            updateStation(station);
                    }} />

                    <Divider orientation="left">OR</Divider>

                    <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleGetLocation}>
                        Use My Location
                    </Button>

                    <Divider orientation="left">OR</Divider>

                    {showMap && (
                        <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleToggleMap}>
                            Hide the Map
                        </Button>)}

                    {!showMap && (
                        <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleToggleMap}>
                            Pick from a Map
                        </Button>)}
                    <br />

                    {showMap && (
                        <>
                            <div style={{ fontSize: 'medium' }}>Select a station on the map below for station information, crop water use, and related information</div>
                            <MapContainer
                                center={[44.0, -120.5]}
                                zoom={6.0}
                                style={{ height: "100%", width: "100%" }}
                                maxBounds={OregonBounds}
                                scrollWheelZoom={false}
                                zoomControl={false}
                                doubleClickZoom={false}
                                dragging={false}
                                touchZoom={false}
                                boxZoom={false}
                                keyboard={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                                />

                                {/* Render circles for each station */}
                                {stationData.features.map((feature, index) => {
                                    const coords = feature.geometry.coordinates;
                                    const latlng = { lat: coords[1], lng: coords[0] };
                                    const color = typeColorMap[feature.properties.type?.toUpperCase()] || typeColorMap["default"];
                                    const isActive = feature.properties.siteid === selectedStation;

                                    return (
                                        <Circle
                                            key={index}
                                            center={latlng}
                                            radius={isActive ? 16000 : 8000}
                                            eventHandlers={{
                                                click: (e) => {
                                                    featureProps.current = feature.properties;
                                                    setSelectedStation(feature.properties.siteid)
                                                }
                                            }}
                                            pathOptions={{
                                                color: color,
                                                fillColor: isActive ? color : 'red',
                                                fillOpacity: isActive ? 0.3 : 0.15,
                                                weight: isActive ? 4 : 2
                                            }}
                                        />
                                    );
                                })}

                                {/* Show user location marker if available */}
                                {userLocation && userLocation.lat && userLocation.lng && (
                                    <Circle
                                        center={userLocation}
                                        radius={12000}
                                        pathOptions={{
                                            color: "#222",
                                            fillColor: "#222",
                                            fillOpacity: 0.2,
                                            weight: 2,
                                            dashArray: "4 4"
                                        }}
                                    >
                                        <Popup>
                                            <div>
                                                <strong>Your Location</strong><br />
                                                Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                                            </div>
                                        </Popup>
                                    </Circle>
                                )}

                            </MapContainer>
                        </>
                    )}
                </Col>

                <Col xs={24} lg={14}>
                    <Divider orientation="left">Station: {selectedStation ? selectedStation.toUpperCase() : 'None'}</Divider>
                    <span style={{ fontSize: '14px', color: 'white' }}>Station Name: {selectedStationName.current || 'No station selected'}</span>
                    <Collapse accordion defaultActiveKey={['2']} style={{marginTop: '1em'}} items={resultItems} />
                </Col>
            </Row>
            )}
            </div>
        </>
    );
};

export default Agrimet;
