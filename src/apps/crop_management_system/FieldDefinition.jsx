import { useState } from "react";
import { Row, Col, Button, Form } from "antd"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
//import VectorTileLayer from "react-esri-leaflet/plugins/VectorTileLayer"
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import SoilsImage from "./soils.jpg"



const FieldLocator = () => {

    // Fix default marker icon issue in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const OregonBounds = [
        [41.991794, -124.566244], // Southwest
        [46.292035, -116.463262], // Northeast
    ];

    const [latlng, setLatlng] = useState(null);

    const LocationSelector = ({ value, onChange }) => {
        useMapEvents({
            click(e) {
                onChange(e.latlng);
            },
        });
    
        return value ? <Marker position={value} /> : null;
    };

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

    return (
        <div style={{ height: 300, marginBottom: 8 }}>
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

                {/* 
                <VectorTileLayer url={'https://vectortileservices1.arcgis.com/CD5mKowwN6nIaqd8/arcgis/rest/services/Oregon_Hyd_Area_Ag_Boundaries_20241016/VectorTileServer'} />
                */}
                <LocationSelector value={latlng} onChange={handleMapChange} />
                
            </MapContainer>
        </div>
    )
}

const FieldDefinition = ({ form }) => {
    const handleChange = (e) => {
        //const { name, value } = e.target;
        //setForm((prev) => ({
        //    ...prev,
        //    [name]: value,
        //}));
    };

    return (
        <>
            <Row>
                <Col sm={24} md={12} lg={12} xl={12}>
                    <FieldLocator />
                </Col>
                <Col span={24} md={12} lg={12} xl={12}>
                    <Form.Item label="Location" name="location" required>
                        <input
                            type="text"
                            name="location"
                            value={form.location || ""}
                            onChange={handleChange}
                            required
                            placeholder="lat,lng"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <img src={SoilsImage} alt="Soils" style={{ width: "100%", marginBottom: 8 }} />

        </>
    );
}


export default FieldDefinition;
