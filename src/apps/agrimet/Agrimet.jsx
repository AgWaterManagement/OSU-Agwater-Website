import { useState, useRef, useEffect } from "react";
import { Row, Col, Button, Form, Typography, Select, Table } from "antd"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';


import stationData from "./usbr_map.json"

const { Title } = Typography;

// Color mapping for each 'type' property
const typeColorMap = {
    "AGRIMET": "blue",
    "COAGMET": "green",
    "HYDROMET": "red",
    "METEOROLOGICAL": "orange",
    // Add more mappings as needed based on your data
    "default": "gray"
};

// Helper to create a colored marker icon
const createColoredIcon = (color) =>
    new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41]
    });


const Agrimet = () => {

    // State to hold fetched station data
    const [station, setStation] = useState(['CRVO']);
    //const cropNames = useRef([]);
    const crops = useRef([]);
    const chartData = useRef([]);
    const [selectedCrop, setSelectedCrop] = useState('');

    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];

    // Scrape and parse data from astoch.txt
    async function fetchCWUData() {
        const url = 'https://agwater.org:5556/agrimet/cwu?station=' + station;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${station} data`);
            const json = await response.json();
            chartData.current = json.cwuData;
            crops.current = json.crops; // Reset crop names
            return;
        } catch (error) {
            console.error("Error fetching station-sepcific data", error);
            return;
        }
    }

    fetchCWUData();

    const getLocationInfo = () => {
        // Parse lat/lng from form.location if available
        let latlng = null;
        if (form.location) {
            try {
                const [lat, lng] = form.location.split(",").map(Number);
                if (!isNaN(lat) && !isNaN(lng)) latlng = { lat, lng };
            } catch { }
        }
    };

    const handleMapChange = (latlng) => {
        // Save as "lat,lng" string
        handleChange({
            target: {
                name: "location",
                value: `${latlng.lat},${latlng.lng}`,
            },
        });
    };

    const selectCropOptions = crops.current.map(crop => ({
        value: crop.cropCode,
        label: crop.name
    }));

    const onSelectedCropChange = (value, option) => {
        console.log('Selected crop:', value, 'at label:', option.label);
        setSelectedCrop(value);
    }

    const ExtraCropInfo = () => {
        const crop = crops.current.find(c => c.cropCode === selectedCrop);
        if (crop == null)
            return (<span>No crop specified</span>);

        const dataSource = [
            {
                key: crop.cropCode,
                startDate: crop.startDate,
                coverDate: crop.coverDate,
                termDate: crop.termDate,
                sumET: crop.sumET,
                sevenDayUse: crop.sevenDayUse,
                fourteenDayUse: crop.fourteenDayUse,
                name: crop.name,
            }];

        const columns = [
            {title: 'Name',dataIndex: 'name',key: 'name',},
            { title: 'Start Date', dataIndex: 'startDate', key: 'startDate', align:'center' },
            { title: 'Cover Date', dataIndex: 'coverDate', key: 'coverDate', align: 'center' },
            { title: 'Term Date', dataIndex: 'termDate', key: 'termDate', align: 'center' },
            { title: 'Sum ET', dataIndex: 'sumET', key: 'sumET', align: 'center' },
            { title: '7-Day Use', dataIndex: 'sevenDayUse', key: 'sevenDayUse', align: 'center' },
            { title: '14-Day Use', dataIndex: 'fourteenDayUse', key: 'fourteenDayUse', align: 'center' },
        ];

        return <Table dataSource={dataSource} columns={columns} />;
    }


    return (
        <>
            <Title level={3} style={{ textAlign: "center", fontSize: "1.5rem" }}>
                Agrimet - Oregon
            </Title>

            <p>Below we provide access to weather and evapotranspiration data from The Bureau of Reclamation's <a href="https://www.usbr.gov/pn/agrimet/">Agrimet network</a>.
                The Agrimet network provides weather data from various stations across the Pacific Northwest, including Oregon.
                This data can help farmers and agricultural professionals make informed decisions about irrigation, crop management, and other agricultural practices.
                The page provides access to Oregon-specific Agrimet data and products.
            </p>

            <Row gutter={6} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={12} style={{ height: 640 }} >
                    <div>Current Station: {station}</div>
                    <MapContainer
                        center={[44.0, -120.5]}
                        zoom={6.5}
                        style={{ height: "100%", width: "100%" }}
                        maxBounds={OregonBounds}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Render markers for each station */}
                        {stationData.features.map((feature, index) => {
                            const coords = feature.geometry.coordinates;
                            const latlng = { lat: coords[1], lng: coords[0] };
                            const props = feature.properties;
                            // Pick color based on type, fallback to 'default'
                            const color = typeColorMap[props.type?.toUpperCase()] || typeColorMap["default"];
                            const icon = createColoredIcon(color);

                            return (
                                <Marker key={index} position={latlng} icon={icon}>
                                    <Popup>
                                        <div>
                                            <strong>{props.name}</strong><br />
                                            {props.title && <span><strong>Site: {props.title}</strong><br /></span>}
                                            {props.siteid && <span>Site ID: {props.siteid}<br /></span>}
                                            {props.region && <span>Program: {props.region}<br /></span>}
                                            {props.url && <span>Link: {props.url}<br /></span>}
                                            {props.install && <span>Installed: {props.install}<br /></span>}
                                            <Button style={{ color: 'black' }} id={props.siteid} onClick={(e) => setStation(e.currentTarget.id)}> Select this Station</Button>
                                            {/* Add more fields as needed */}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* 
                   <VectorTileLayer url={'https://vectortileservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/VectorTileServer'} />
                   */}

                    </MapContainer>
                </Col>

                <Col xs={24} lg={12}>
                    <div style={{ marginLeft: '1em' }}>
                        <label htmlFor='selectCrop'>Select a crop from the list: </label>
                        <Select
                            id='selectCrop'
                            showSearch
                            placeholder="Select a crop"
                            optionFilterProp="label"
                            onChange={onSelectedCropChange}
                            options={selectCropOptions}
                        />
                        <br />

                        <ResponsiveContainer width="100%" height={320} style={{ backgroundColor: 'white' }}>
                            <Title level={4} style={{ color: 'black', textAlign: 'center' }}>Crop Water Use - Last Five Days</Title>
                            <LineChart
                                width='100%'
                                height='100%'
                                data={chartData.current}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 50,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="Date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />

                                {crops.current.length > 0 && crops.current.map((crop, index) => {
                                    if (crop.cropCode === 'ETr' || crop.cropCode === selectedCrop) {
                                        return (<Line key={crop.cropCode} type="monotone" dataKey={crop.name} stroke={index === 0 ? "#8884d8" : "#82ca9d"} />)
                                    }
                                }
                                )};

                            </LineChart>
                        </ResponsiveContainer>
                        <br />
                        {selectedCrop !== '' && ExtraCropInfo()}
                    </div>
                </Col>
            </Row>
        </>
    )
};

export default Agrimet;