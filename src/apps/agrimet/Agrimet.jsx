import { useState, useRef, useEffect } from "react";
import { Row, Col, Button, Form, Typography, Select, Table, Divider, Cascader, Collapse, message } from "antd";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
    const [showMap, setShowMap] = useState(false); // State to control map visibility }
    const [userLocation, setUserLocation] = useState(getStationLatLong(selectedStation));  // from geolocation

    const selectedCropName = useRef(() => ''); // Store the name of the selected crop
    const selectedStationName = useRef(getSelectedStationName(selectedStation)); // Store the name of the selected station

    const dates = useRef([]);           // list of dates for the selected station's observations, e.g. ['2025-07-01', '2025-07-02', ...]
    const crops = useRef({});           // list of crops for the selected station, e.g. { 'WGRN': 'Winter Wheat', ... }
    const stationCropData = useRef([]); // station crop data (e.g. planting dates) for all crops
    const nwsForecast = useRef({}); // Store NWS forecast data

    const [chartData, setChartData] = useState([]); // Use state to trigger re-renders]
    const featureProps = useRef({});
    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];

    // Scrape and parse data from astoch.txt
    async function fetchCWUData() {
        console.log("Fetching CWU data for station:", selectedStation);
        const url = 'https://agwater.org:5556/agrimet/cwu_chart_data?station=' + selectedStation;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${selectedStation} data`);
            const json = await response.json();

            if (!json || json.success == false)
                throw new Error(`No data found for station ${selectedStation}`);

            crops.current = json.crop_codes; // {crop_code: crop label}, ...}
            dates.current = json.dates; // [day1, ..
            stationCropData.current = json.station_crop_data;
            nwsForecast.current = json.nws_forecast;

            const _chartData = [];
            const dateArray = json.chart_data['Date'] || [];

            // reinterpret the fetched chart data to be compatible with recharts
            for (let i = 0; i < dateArray.length; i++) {  // iterate through observations (days), adding a new object for each day to the array
                const dataPoint = {}; // one day, dict with all fields
                for (const [key, value] of Object.entries(json.chart_data)) {  // Iterate through each field in the chart_data
                    dataPoint[key] = value[i]; // Add other fields
                }
                _chartData.push(dataPoint);
            }

            setChartData(_chartData); // json.chart_data); // Set chart data in state
            return;
        } catch (error) {
            setChartData([]); // Reset chart data
            crops.current = {}; // Reset crop names
            dates.current = []; // Reset dates
            stationCropData.current = [];
            console.error("Error fetching station-specific data", error);
            return;
        }
    }

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
        fetchCWUData();
    }, [selectedStation]);

    useEffect(() => {
        setCookie('agrimet_crop', selectedCrop);
    }, [selectedCrop]);

    ///////////////////////////
    // <Select> Station Options
    ///////////////////////////
    //function selectStationOptions(features, state) {
    //    const stations = [];
    //    let i = 0;
    //    features.forEach((feature) => {
    //        const props = feature.properties;
    //        if (props.state === state) {
    //            stations.push({
    //                key: i,
    //                value: props.siteid,
    //                label: `${props.title} (${props.siteid})`
    //            });
    //        }
    //        i += 1;
    //    });
    //    return stations;
    //}

    /*
    const options = [
        {
            value: 'zhejiang',
            label: 'Zhejiang',
            children: [
                {
                    value: 'hangzhou',
                    label: 'Hangzhou',
                    children: [
                        {
                            value: 'xihu',
                            label: 'West Lake',
                        },
                    ],
                },
            ],
        },
        {
            value: 'jiangsu',
            label: 'Jiangsu',
            children: [
                {
                    value: 'nanjing',
                    label: 'Nanjing',
                    children: [
                        {
                            value: 'zhonghuamen',
                            label: 'Zhong Hua Men',
                        },
                    ],
                },
            ], */

    function selectStationOptions(features) {
        const stations = {};
        let i = 0
        features.forEach((feature) => {
            const props = feature.properties;
            if (!(props.state in stations))
                stations[props.state] = []; // Initialize array for the state if not already present

            stations[props.state].push({
                key: 's_' + i,
                value: props.siteid,
                label: props.title
            });
            i += 1;
        });

        const items = []
        for (const state in stations) {
            items.push({
                key: 'sn_' + i,
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




    const CropInfoTable = () => {
        if (!selectedCrop || !stationCropData.current || stationCropData.current.length === 0) {
            return (<span>No crop data available</span>);
        }
        const crop = stationCropData.current.find(c => c.code === selectedCrop);
        if (crop == null)
            return (<span>No crop specified</span>);

        const dataSource = [
            {
                key: crop.code,
                startDate: crop.startDate,
                coverDate: crop.coverDate,
                termDate: crop.termDate,
                sumET: crop.sumET,
                sevenDayUse: crop.sevenDayUse,
                fourteenDayUse: crop.fourteenDayUse,
                name: crop.name,
            }];

        const columns = [
            { title: 'Name', dataIndex: 'name', key: 'name', },
            { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', align: 'center' },
            { title: 'Cover Date', dataIndex: 'coverDate', key: 'coverDate', align: 'center' },
            { title: 'Term Date', dataIndex: 'termDate', key: 'termDate', align: 'center' },
            { title: 'Sum ET', dataIndex: 'sumET', key: 'sumET', align: 'center' },
            { title: '7-Day Use', dataIndex: 'sevenDayUse', key: 'sevenDayUse', align: 'center' },
            { title: '14-Day Use', dataIndex: 'fourteenDayUse', key: 'fourteenDayUse', align: 'center' },
        ];

        return <Table dataSource={dataSource} columns={columns} />;
    };



    const resultItems = [
        {
            key: '1',
            label: 'Station Information - ' + selectedStationName.current,
            children: <StationInfo stationInfo={featureProps.current} />,
        },
        {
            key: '2',
            label: 'Current Weather Conditions - ' + selectedStationName.current,
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
            label: 'Crop Water Use - ' + selectedStationName.current,
            children: <CropWaterUseChart chartData={chartData} selectedCrop={selectedCrop} selectCropOptions={selectCropOptions}
                onSelectedCropChange={setSelectedCrop} />,
        },
        {
            key: '4',
            label: 'Crop Planting, Harvest Date + Seasonal Water Use - ' + selectedStationName.current,
            children: <CropInfoTable />,
        }
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

            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={12} style={{ height: 360 }} >
                    <Divider orientation="left">Select a Agrimet station</Divider>

                    <Cascader key='stationCascader' defaultValue={[selectedState, selectedStation]} style={{ width: '24em' }} options={stationOptions} onChange={value => {
                        const [state, station] = value;
                        setSelectedState(state);
                        setSelectedStation(station);
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

                <Col xs={24} lg={12}>
                    <Divider orientation="left">Agrimet Station Results</Divider>
                    <Collapse accordion defaultActiveKey={['2']} items={resultItems} />
                </Col>
            </Row>
        </>
    );
};

export default Agrimet;
