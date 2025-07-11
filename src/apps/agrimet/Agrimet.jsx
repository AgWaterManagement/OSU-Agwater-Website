import { useState, useRef, useEffect } from "react";
import { Row, Col, Button, Form, Typography } from "antd"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';


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
    const cwuData = useRef([]);

    let chartData = useRef([]);
    let cropNames = useRef([]);

    const etCols = [
        "Daily Penman ET (in)-4",
        "Daily Penman ET (in)-3",
        "Daily Penman ET (in)-2",
        "Daily Penman ET (in)-1",
        "Daily Penman ET (in)"
    ];

    useEffect(() => {
        //const fetchAgrimetJson = async () => {
        //    try {
        //        const response = await fetch("https://www.usbr.gov/pn/agrimet/agrimetmap/usbr_map.json");
        //        if (!response.ok) throw new Error("Failed to fetch Agrimet JSON");
        //        const data = await response.json();
        //        // Store features in state
        //        setStations(data.features || []);
        //    } catch (error) {
        //        console.error("Error fetching Agrimet JSON:", error);
        //    }
        //};
        //fetchAgrimetJson();
    }, []);


    // Scrape and parse data from astoch.txt
    async function fetchCWUData() {
        const url = 'https://agwater.org:5556/agrimet/cwu?station=' + station;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${station} data`);
            const json = await response.json();
            // Example: split into lines and filter out comments/empty lines
            // Optionally, parse each line into fields if the format is known
            // Example: return as array of lines
            cwuData.current = json;
            prepChartData();


            return json;
        } catch (error) {
            console.error("Error fetching astoch.txt:", error);
            return [];
        }
    }

    fetchCWUData();

    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];

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

    const prepChartData = () => {
        // get today's date and the four day's prior and store in an array
        // [{ Date: 4daysago, 'ETr': ETr - 4, 'crops1': Crp1 - 4, ...},
        //  { Date: 3daysago, 'ETr': ETr - 3, 'crops1': Crp1 - 3, ...}, etc

        //        {
        //   "Crop": "ETr",
        //   "Start Date": "01/01",
        //   "Daily Penman ET (in)-4": "0.36",
        //   "Daily Penman ET (in)-3": "0.34",
        //   "Daily Penman ET (in)-2": "0.31",
        //   "Daily Penman ET (in)-1": "0.26",
        //   "Daily Penman ET (in)": "0.30",
        //   "Cover Date": "01/01",
        //   "Term Date": "12/31",
        //   "Sum ET (in)": "23.3",
        //   "7 Day Use": "2.0",
        //   "14 Day Use": "4.0"
        // },

        const dates = [];
        const today = new Date();
        chartData.current = [];
        cropNames.current = [];
        cwuData.current.forEach(crop =>
            cropNames.current.push(crop)
        );

        for (let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dates.push(date);
        }

        // each column in the data we are gnerating  is a crop, each row (observation)  is a date
        for (let i = 0; i < 5; i++) {
            let rowData = {};
            rowData['Date'] = dates[i].toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
            cwuData.current.forEach((crop, index) => {
                const cropName = crop['Crop'];
                const et = crop[etCols[i]];
                rowData[cropName] = et;
            });
            chartData.current.push(rowData);
            console.log(rowData);
        };
        return;
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

            <Row gutter={2} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={12} style={{ height: 640 }} >

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
                    {stationData.features.map((feature, idx) => {
                        const coords = feature.geometry.coordinates;
                        const latlng = { lat: coords[1], lng: coords[0] };
                        const props = feature.properties;
                        // Pick color based on type, fallback to 'default'
                        const color = typeColorMap[props.type?.toUpperCase()] || typeColorMap["default"];
                        const icon = createColoredIcon(color);

                        return (
                            <Marker key={idx} position={latlng} icon={icon}>
                                <Popup>
                                    <div>
                                        <strong>{props.name}</strong><br />
                                        {props.title && <span><strong>Site: {props.title}</strong><br /></span>}
                                        {props.siteid && <span>Site ID: {props.siteid}<br /></span> }
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
                    <LineChart width={600} height={300} data={stationData}>
                        <CartesianGrid />
                        {cropNames.current.length > 0 && cropNames.current.map(cropName => {
                            console.log('Plotting' + cropName);
                            return <Line dataKey={cropName} />
                        })}
                        <XAxis dataKey="Date" />
                        <YAxis />
                         <Legend />
                    </LineChart>
                </Col>
            </Row>
        </>
    )
};

export default Agrimet;