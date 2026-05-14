import { useState, useRef, useEffect } from "react";
import { Layout, Row, Col, Button, Typography, Select, Table, Divider, Cascader, Collapse, message, Tabs } from "antd";

import "leaflet/dist/leaflet.css";
import "./agrimet.css";

import { secrets } from "../../secrets";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

import StationInfo from "./StationInfo";
import CropWaterUseChart from "./CropWaterUseChart";

import NWSForecast from "../../components/weather/NWSForecast";

//import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import Loading from "../../components/loading/Loading";

import stationData from "./usbr_map.json";
//import openTab from "../../../public/mages/openTab.png";
const { Title, Text } = Typography;
const { Header, Sider  } = Layout;
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";


import {
    DoubleRightOutlined,
    DoubleLeftOutlined,
} from '@ant-design/icons';


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

    // station info
    // Load initial station/crop from cookie if available
    const [selectedState, setSelectedState] = useState(() => getCookie('agrimet_state') || 'OR');
    const [selectedStation, setSelectedStation] = useState(() => getCookie('agrimet_station') || 'crvo');
    const selectedStationName = useRef(getSelectedStationName(selectedStation)); // Store the name of the selected station
    const selectedStationLatLong = useRef(getStationLatLong(selectedStation)); // Store the lat/long of the selected station
    //const stateStationOptions= useRef([]); // station options for the selected state, for the Cascader component

    const [selectedStationData, setSelectedStationData] = useState(null);  // data about the selected station.  This includes 
                                        // crop information for all crops grown at the station, and is used to generate
                                        // the crop information table and the crop water use chart.  It is fetched from 
                                        // the API when a station is selected.
    
    const stationCropData = useRef([]); // station crop data (e.g. planting dates, harvest dates, recent water use) for all crops
                                        // at station.  This is used to generate the crop water use chart and the
                                        // tabular crop information data, and is fetched from the API when a station is selected. 
                                        // It is stored in a ref to avoid unnecessary re-renders of the component when the data
                                        // is updated.
    const [cropETData, setCropETData] = useState({}); // Store crop ET data for the selected station, which is used to
    //const cropETData = useRef({}); // Store crop ET data for the selected station, which is used to
                                        // generate the season-to-date crop water use chart for a given crop grown at that station.
                                        // This is fetched from the API when a station is selected.
                                        // It is stored in a ref to avoid unnecessary re-renders of the component when the data
                                        // is updated.
    // crop coefficient info
    const [selectedCrop, setSelectedCrop] = useState(() => getCookie('agrimet_crop') || 'WGRN');
    const selectedCropName = useRef(() => ''); // Store the name of the selected crop
    const [cropCoefficients, setCropCoefficients] = useState({});   /// crop coefficient data for all crops, keyed by crop code, from agwater JSON
    const [selectedCoefficientCrop, setSelectedCoefficientCrop] = useState('ALFP');

    // UI state
    const [collapsed, setCollapsed] = useState(false);  // sidebar (Sider) open/closed
    const [showMap, setShowMap] = useState(true); // State to control map visibility }
    const [selectedTab, setSelectedTab] = useState('1'); // Track selected tab
    const [showCoefficientTable, setShowCoefficientTable] = useState(false); // State to toggle coefficient table
    const userLocation = useRef({});  // from geolocation

    //const nwsForecast = useRef({}); // Store NWS forecast data

    const featureProps = useRef({});
    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];

    /*
    const fetchNWSForecast = async (lat, lng) => {
        try {
            const response = await fetch(`https://agwater.org:5556/agrimet/nws_forecast?latitude=${lat}&longitude=${lng}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch forecast: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.forecast && data.forecast.periods) {
                nwsForecast.current = data.forecast.periods;
            }
        } catch (error) {
            console.error('Error fetching NWS forecast:', error);
            nwsForecast.current = [];
        }
    };
*/


    const [messageApi, contextHolder] = message.useMessage();
    const info = () => {
        messageApi.info('Hello, Ant Design!');
    };

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
                info(`Failed to fetch crop daily ET data for station ${selectedStation}: ${response.status}`);
                throw new Error(`Failed to fetch crop_et_data: ${response.status}`);
            }
            const data = await response.json();

            if (data.success && data.data) {
                setCropETData(data);
                console.log('Crop ET data loaded:', data);
                info(`Crop ET data loaded: ${Object.keys(data.data).length} days available.`);
            } else {
                setCropETData({});
                info(`No crop ET data available for station ${selectedStation}.`);
                console.warn(`No crop ET data available for station ${selectedStation}:`, data);
            }

        } catch (error) {
            setCropETData({});
            console.error('Error loading crop ET data:', error);
            info(`Error loading crop ET data: ${error.message}`);
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
                    info(`Failed to fetch crop coefficients: ${response.status}`);
                    throw new Error(`Failed to fetch crop_coefficients: ${response.status}`);
                }
                const data = await response.json();

                Object.entries(data.data).forEach(([, crop]) => {
                    let gsi = []
                    if (crop.growth_stage_indicators) {
                        for (let i = 0; i < 21; i++) {
                            if (i * 10 in crop.growth_stage_indicators)
                                gsi.push(crop.growth_stage_indicators[i * 10]);
                            else
                                gsi.push(null);
                        }
                    }
                    crop.growth_stage_indicators_list = gsi;
                });
                setCropCoefficients(data.data);
                info(`Crop coefficients loaded: ${Object.keys(data.data).length} crops available.`);
                console.log('Crop coefficients loaded:', data);
            } catch (error) {
                info(`Error loading crop coefficients: ${error.message}`);
                console.error('Error loading crop coefficients:', error);
                setCropCoefficients({});
            }
        };

        fetchCropCoefficients();
        fetchCropETData();

        // get the current station from stationData.features using the selectedStation siteid, and set the user location to the station coordinates
        const feature = stationData.features.find(f => f.properties.siteid === selectedStation);
        if (!feature) {
            console.error(`Station ${selectedStation} not found in station data.`);
            return;
        }
        const { latitude, longitude } = feature.geometry.coordinates;
        selectedStationLatLong.current = { lat: latitude, lng: longitude }; // Store the lat/long of the selected station

        featureProps.current = feature.properties; // Store the properties of the selected station
        // Set user location to the station's coordinates
        userLocation.current = { lat: latitude, lng: longitude };
    }, []);

    // When selectedStation is updated:
    // 1) Store station in cookie,
    // 2) update user location
    // 3) fetch crop water use data for the station
    useEffect(() => {

        setCookie('agrimet_station', selectedStation);

        selectedStationName.current = getSelectedStationName(selectedStation); // Store the name of the selected station
        selectedStationLatLong.current = getStationLatLong(selectedStation); // Store the lat/long of the selected station
        userLocation.current = selectedStationLatLong.current; // Update user location to the station's coordinates
        
        // find the station lat/long for the selected station in the stationData
        const feature = stationData.features.find(f => f.properties.siteid === selectedStation);
        if (!feature) {
            console.error(`Station ${selectedStation} not found in station data.`);
            return;
        }
        featureProps.current = feature.properties; // Store the properties of the selected station

        // get the cropw water use chart data for the selected station
        fetchCropETData();
        
        // fetch the NWS forecast for the station location
        // fetchNWSForecast(latitude, longitude);

    }, [selectedStation]);

    useEffect(() => {
        //let cropCoeffChartData = getCropCoefficientChartData(selectedCrop);
        setCookie('agrimet_crop', selectedCrop);
    }, [selectedCrop]);


    function selectStationOptions(features) {
        const stations = {};  // key = state, value = list of stations (children) in that state
        let i = 0
        features.forEach((feature) => {
            const properties = feature.properties;
            if (!(properties.state in stations))
                stations[properties.state] = []; // Initialize array for the state if not already present

            // add site information to the appropriate state 
            stations[properties.state].push({
                key: properties.siteid + '_' + i,
                value: properties.siteid,
                label: properties.title
            });
            i += 1;
        });

        // build the options array for the Cascader component from the stations object,
        //  which groups stations by state
        const items = []
        i = 0;
        for (const state in stations) {
            items.push({
                //key: 'state_' + i,
                value: state,
                label: state,
                children: stations[state]
            })
            i += 1;
        };
        return items;
    }

    const stationCascaderOptions = selectStationOptions(stationData.features); //, selectedState);

    // <Select> Crop Options
    const selectCropOptions = [];
    // iterate through stationCropData array and create options
    if (stationCropData.current && stationCropData.current.length > 0) {
        let index = 0;
        for (const crop of stationCropData.current) {
            selectCropOptions.push({
                key: crop.code + '_' + index,
                value: crop.code,
                label: crop.name
            })
            index += 1;
        }
    }

/*
    const updateState = (state) => {
        // find the first station in the selected state and set it as the selected station
        // Note that stationCascaderOptions is an array of objects with 'value' and 'children' properties, 
        // where 'value' is the state name and 'children' is an array of station options for that state.
        if (!stationCascaderOptions || stationCascaderOptions.length === 0 || state == null) {
            return;
        }   

        const _selectedState = stationCascaderOptions.find(s => s.value === state);

        stateStationOptions.current = _selectedState?.children || [];

        const _selectedStation = _selectedState?.children[0]?.value || null;
        setSelectedStation(_selectedStation);
    };
*/
    const updateStation = (station, state) => {
        const fetchSelectedStationData = async () => {
            try {
                // fetch the station crop info for the selected station from the API
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
                console.log(`Crop data loaded for station ${station}:`, stationJson);
                info(`Crop data loaded for station ${station}: ${stationJson.crop_data ? stationJson.crop_data.length : 0} crops available.`);
            } catch (error) {
                console.error("Error fetching selected station crop info", error);
                setSelectedStationData(null);
                info(`Error loading crop data for station ${station}: ${error.message}`);
            }
        };

        fetchSelectedStationData();
        setSelectedStation(station);
        setSelectedState(state);
        setCollapsed(true)
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
                userLocation.current = { lat: latitude, lng: longitude };

                // Find nearest station
                let minDist = Infinity;
                let nearestStation = null;
                let nearestState = null;
                stationData.features.forEach(feature => {
                    const coords = feature.geometry.coordinates;
                    const dist = getDistance(latitude, longitude, coords[1], coords[0]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestStation = feature.properties.siteid;
                        nearestState = feature.properties.state;
                    }
                });
                if (nearestStation) {
                    updateStation(nearestStation, nearestState); 
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
                pctGrowth: index * 10,
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
                                    <XAxis dataKey="pctGrowth" ticks={chartTicks} stroke="yellow" style={{ fontWeight: 'normal' }} height={50} label={{ stroke: 'white', value: 'Percent Growth Stage (%)', position: 'insideBottom', }} />
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
                                            render: (value) => value ? value.toFixed(2) : null,
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

    const CropInfoTable = (selectedStationData) => {
        if (!selectedStationData || ! selectedStationData.selectedStationData || !selectedStationData.selectedStationData.crop_data) {
            return (<span>No crop data available</span>);
        }
        //const crop = stationCropData.current.find(c => c.code === selectedCrop);
        //if (crop == null)
        //    return (<span>No crop specified</span>);

        const cropData = selectedStationData.selectedStationData.crop_data;
        // add a 'key' field to each crop object in the cropData list for use in the Ant Design Table component
        cropData.forEach((crop, index) => {
            crop.key = 'stcrop_' + index;
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
        ];

        return (
            <>
                <Table dataSource={cropData} columns={columns} />
            </>
        );
    };


    const Methods = () => {
        const methodItems = [
            {
                key: 'ccChart',
                label: 'Crop Coefficient Chart',
                children: (<div>
                    <p style={{ marginBottom: 0 }}>
                        This chart provides crop coefficients (Kc) values for a range of crops.  These coefficients are not station-specific,
                        but rather represent generalized values used across the region.  The crop coefficients are used on this site are largely
                        derived from Agrimet values, but may be slightly modified if more acccurate coeffients are identified.
                    </p>
                    <p>
                        The data in this chart was obtained from the agwater API at: <a href={'https://agwater.org:5556/json?path=agrimet&file=crop_coefficients'}>
                            {'https://agwater.org:5556/json?path=agrimet&file=crop_coefficients'}</a>, which is based largely on the
                        Agrimet coefficients available at: <a href={'https://www.usbr.gov/pn/agrimet/cropcurves/crop_coefficients.txt'}>
                            {'https://www.usbr.gov/pn/agrimet/cropcurves/crop_coefficients.txt'}</a>

                    </p>

                </div>)
            }, {
                key: 'cwuChart',
                label: 'Crop Water Use Chart',
                children: (<div>
                    <Title level={5}>Growing Season Crop Water Use/Precipitation</Title>
                    <p style={{ marginBottom: 0 }}>
                        The Crop Water Use Chart displays crop water use and precipitation data from the start of the growing season for the selected station and crop.
                        Potential ET (based on a reference crop of XXX, and is estimated with the ___ equation) Actual ET, reflecting actual crop water use, is determined by
                        multiplying the daily crop coefficients by the potential ET.
                    </p>
                    <Title level={5}>Data Sources</Title>
                    <p>Crop Water Use for given station</p>
                    <span style={{ marginLeft: '1em' }}>
                        <a href={'https://www.usbr.gov/pn-bin/daily.pl?station={station}&year={current_year}&month=1&day=1&year={current_year}&month={yesterday_month}&day={yesterday_day}&pcode=ET'}>
                            {'https://www.usbr.gov/pn-bin/daily.pl?station={station}&year={current_year}&month=1&day=1&year={current_year}&month={yesterday_month}&day={yesterday_day}&pcode=ET'}</a>
                    </span>
                    <br />

                    <p>Crop Coefficients (Kc)</p>
                    <span style={{ marginLeft: '1em' }}>
                        The data in this chart was obtained from the agwater API at: <a href={'https://agwater.org:5556/json?path=agrimet&file=crop_coefficients'}>
                            {'https://agwater.org:5556/json?path=agrimet&file=crop_coefficients'}</a>, which is based largely on the
                        Agrimet coefficients available at: <a href={'https://www.usbr.gov/pn/agrimet/cropcurves/crop_coefficients.txt'}>
                            {'https://www.usbr.gov/pn/agrimet/cropcurves/crop_coefficients.txt'}</a>
                    </span>

                    <br />
                </div>)
            }, {
                key: 'Data Sources',
                label: 'Data Sources',
                children: (
                    <>
                        <div>Tabular Results (presented in other panel)</div>
                        <div>These are retrieved from the agwater api at: <a href={'https://agwater.org:5556/agrimet/station_crop_info?station=${station}'}>
                            {'https://agwater.org:5556/agrimet/station_crop_info?station=${station}'}
                        </a>, which in turn retrieves the data from the Agrimet page at: <a href={'https://www.usbr.gov/pn/agrimet/chart/{station}ch.txt'}>
                                {'https://www.usbr.gov/pn/agrimet/chart/{station}ch.txt'}
                            </a>

                            <p>
                                This API returns arrays of information decribing crop water use data for crops grown at that station.
                                Crop information returned includes the following:
                            </p>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75em' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', borderBottom: '1px solid #d9d9d9', padding: '0.5em' }}>Metric</th>
                                        <th style={{ textAlign: 'left', borderBottom: '1px solid #d9d9d9', padding: '0.5em' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>CropCode</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Identifier for the crop associated with the station record.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Start Date</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Date the crop water use period begins.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Full Cover Date</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Date the crop reaches full canopy cover.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Termination Date</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Date the crop water use period ends.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET (in)-4</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET value four days before the current day.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET (in)-3</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET value three days before the current day.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET (in)-2</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET value two days before the current day.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET (in)-1</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET value one day before the current day.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Daily Penman ET (in)</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Current daily Penman ET value.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Sum ET (in)</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Cumulative ET total for the crop period.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>7 Day Use</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Seven-day crop water use total.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>14 Day Use</td>
                                        <td style={{ padding: '0.45em 0.5em', verticalAlign: 'top' }}>Fourteen-day crop water use total.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>)
            }, {
                key: 'Assumptions',
                label: 'Assumptions',
                children: (<div>

                </div>),
            }, {
                key: 'Limitations',
                label: 'Limitations',
                children: (<div>

                </div>),
            }]

        return (
            <>
                <Collapse defaultActiveKey={['2']} style={{ marginTop: '1em' }} items={methodItems} />
            </>
        );
    }

    const stationItems = [
        {
            key: '1',
            label: 'Station Information',
            children: <StationInfo stationInfo={featureProps.current} />,
        },
        {
            key: '2',
            label: 'Weather/Crop Water Use 7-Day  Forecasts',
            children:
                userLocation.current.lat && userLocation.current.lng ? (
                    <NWSForecast
                        lat={userLocation.current.lat}
                        lng={userLocation.current.lng}
                        locationName={selectedStationName.current || selectedStation}
                    />) : (<Text>No forecast available</Text>)
        },
        {
            key: '3',
            label: 'Season-to-date Crop Water Use Information',
            children: <CropWaterUseChart selectedStation={selectedStation} cropETData={cropETData} />,
        },
        {
            key: '4',
            label: 'Crop Planting, Harvest Date, and Seasonal Water Use',
            children: <CropInfoTable selectedStationData={selectedStationData} />,
        },
        {
            key: '5',
            label: 'Methods and Data',
            children: <Methods />,
        },
    ];

    const tabItems = [
        {
            key: '1',
            label: 'Station Information',
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
            <style>{`.agrimet-map { max-width: 100%; height: 100% !important; display: block; box-sizing: border-box; }
            .agrimet-map .leaflet-tile, .agrimet-map img { max-width: 100%; height: auto; }
            `}</style>
            {loading && <Loading tip="Loading sources..." />}

            <Title level={3} style={{ textAlign: "center", fontSize: "1.5rem" }}>
                Agrimet - Oregon
            </Title>

            <p>Below we provide access to weather and evapotranspiration data from The Bureau of Reclamation's <a href="https://www.usbr.gov/pn/agrimet/">Agrimet network</a>.
                The Agrimet network provides weather data from various stations across the Pacific Northwest, including Oregon.
                This data can help farmers and agricultural professionals make informed decisions about irrigation, crop management, and other agricultural practices.
                The page provides access to Oregon-specific Agrimet data and products.
            </p>

            <div className="no_outline" style={{ marginLeft: '1em', marginRight: '1em', marginTop: '1em' }} >

                <Tabs items={tabItems} activeKey={selectedTab} onChange={setSelectedTab} />

                {/* Crop Coefficients Tab */}
                {selectedTab === '2' && (
                    <CropCoefficientsContent />
                )}
                {/* Station Information Tab */}
                {selectedTab === '1' && (
                    <Layout>
                        {/* Station Selection Sider */}
                        <Sider width={'40%'} trigger={null} collapsible collapsed={collapsed} collapsedWidth={32}>
                            {collapsed ? (
                                <div style={{
                                    transform: 'rotate(90deg)',
                                    transformOrigin: 'left top 0',
                                    marginLeft: 20,
                                    textAlign: 'center',
                                }}>
                                    <Button type="primary" onClick={() => setCollapsed(false)}>
                                        Select Station
                                    </Button>
                                </div>
                            ) : (
                                <div className="" >
                                    <Divider orientation="left">Select an Agrimet station</Divider>
                                    {
                                    <Cascader key='stationCascader1'
                                        defaultValue={[selectedState, selectedStation]} 
                                        value={[selectedState, selectedStation]}
                                        style={{ width: '24em' }}
                                        options={stationCascaderOptions}
                                        onChange={value => {
                                            const [state, station] = value;
                                            updateStation(station, state);
                                        }} />
                                    }
                                    {/*
                                    <Select
                                        key='selectStateOptions'
                                        style={{width: '30em', marginTop: '1em' }}
                                        showSearch
                                        placeholder="Select a state"
                                        optionFilterProp="children"
                                        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                                        onChange={value => {
                                            setSelectedState(value);
                                            updateState(value);
                                        }}
                                    >
                                        {stationOptions.map(station => (
                                            <Select.Option key={station.value} value={station.value}>
                                                {station.label} ({station.children.length} stations)
                                            </Select.Option>
                                        ))}
                                    </Select>

                                    <Select
                                        key='selectStationOptions'
                                        style={{width: '30em', marginTop: '1em' }}
                                        showSearch
                                        placeholder="Select a station"
                                        //optionFilterProp="children"
                                        //filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                                        onChange={value => {
                                            setSelectedStation(value);
                                            updateStation(value);
                                        }}
                                    >
                                        { stateStationOptions.current && stateStationOptions.current.length > 0 && selectedState && 
                                            stateStationOptions.current.map(station => (
                                                <Select.Option key={station.value} value={station.value}>
                                                    {station.label} ({station.value})
                                                </Select.Option>
                                        ))}
                                    </Select>
                                    */}

                                    <Divider orientation="left">OR</Divider>

                                    <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleGetLocation}>
                                        Use My Location
                                    </Button>

                                    <Divider orientation="left">OR</Divider>

                                    {showMap && (
                                        <>
                                            <div style={{ fontSize: 'medium' }}>Select a station on the map below for station information, crop water use, and related information</div>
                                            <div style={{ fontSize: 'medium', width: '100%', maxWidth: '100%', height: '640px', overflow: 'hidden', position: 'relative', boxSizing: 'border-box' }}>
                                                <MapContainer
                                                    className="agrimet-map"
                                                    center={[44.0, -120.5]}
                                                    zoom={6.0}
                                                    style={{ width: "100%", maxWidth: '100%', height: '100%',  display: 'block' }}
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
                                                                        updateStation(feature.properties.siteid, feature.properties.state);
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
                                                    {userLocation.current && userLocation.current.lat && userLocation.current.lng && (
                                                        <Circle
                                                            center={userLocation.current}
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
                                                                    Lat: {userLocation.current.lat.toFixed(4)}, Lng: {userLocation.current.lng.toFixed(4)}
                                                                </div>
                                                            </Popup>
                                                        </Circle>
                                                    )}
                                                    {userLocation.current && userLocation.current.lat && userLocation.current.lng && (
                                                        <Circle
                                                            center={userLocation.current}
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
                                                                    Lat: {userLocation.current.lat.toFixed(4)}, Lng: {userLocation.current.lng.toFixed(4)}
                                                                </div>
                                                            </Popup>
                                                        </Circle>
                                                    )}

                                                </MapContainer>
                                            </div>
                                            <br />
                                        </>
                                    )}
                                    {showMap && (
                                        <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleToggleMap}>
                                            Hide the Map
                                        </Button>)}

                                    {!showMap && (
                                        <Button type="primary" style={{ marginLeft: '1em', marginBottom: '1em' }} onClick={handleToggleMap}>
                                            Pick from a Map
                                        </Button>)}
                                </div>
                            )}
                        </Sider>

                        <Layout style={{backgroundColor:'#000', padding: 0 }}>
                            <Header style={{ padding: 0 }}>
                                 <Button
                                    type="text"
                                    icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                                    onClick={() => setCollapsed(!collapsed)}
                                    className="no_outline"
                                    style={{
                                        fontSize: '24px',
                                        width: 32,
                                        height: 64,

                                    }}
                                /> 
                                    <span style={{fontSize:18, marginLeft: '1em', color: '#fff' }}>
                                    { selectedStationName.current ? `${selectedStationName.current} (${selectedStation.toUpperCase()})` : selectedStation ? selectedStation : 'Select a station to view information'}
                                </span>
                            </Header>

                            {/* Station Information, Station Crop Water Use, etc. panels */}
                            <Collapse accordion defaultActiveKey={['2']} 
                                style={{ backgroundColor: 'black', padding: 0 }}
                                items={stationItems} />
                        </Layout>
                    </Layout>
                )}
            </div>

        </>
    );
};

export default Agrimet;
