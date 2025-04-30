import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Select, Spin, Alert } from "antd";
import "leaflet/dist/leaflet.css";

const { Option } = Select;

const ChoroplethMap = ({ dataUrl, initialProperty, center = [0, 0], zoom = 2 }) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(initialProperty);
  const [error, setError] = useState(null);

  // Fetch GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`Failed to fetch GeoJSON: ${res.statusText}`);
        const json = await res.json();
        setGeoData(json);

        const numericProps = Object.keys(json.features[0].properties).filter(
          (key) => typeof json.features[0].properties[key] === "number"
        );

        // Set initial selected property if it's not valid
        if (!numericProps.includes(initialProperty)) {
          setSelectedProperty(numericProps[0]);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [dataUrl, initialProperty]);

  const getColor = (value, min, max) => {
    const ratio = (value - min) / (max - min || 1);
    const red = Math.floor(255 * ratio);
    const green = Math.floor(255 * (1 - ratio));
    return `rgb(${red}, ${green}, 0)`;
  };

  const getMinMax = (features, property) => {
    const values = features
      .map((f) => f.properties[property])
      .filter((val) => typeof val === "number");
    return [Math.min(...values), Math.max(...values)];
  };

  const styleFeature = (feature, min, max) => {
    const value = feature.properties[selectedProperty];
    const fillColor =
      typeof value === "number" ? getColor(value, min, max) : "#ccc";

    return {
      fillColor,
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7,
    };
  };

  const renderGeoJSON = () => {
    if (!geoData || !selectedProperty) return null;

    const [min, max] = getMinMax(geoData.features, selectedProperty);

    console.log("Rendering GeoJSON with property:", selectedProperty);

    return (
      <GeoJSON
        key={selectedProperty} // Forces re-render when property changes
        data={geoData}
        style={(feature) => styleFeature(feature, min, max)}
        onEachFeature={(feature, layer) => {
          const value = feature.properties[selectedProperty];
          layer.bindPopup(`${selectedProperty}: ${value}`);
        }}
      />
    );
  };

  const availableProperties = geoData
    ? Object.keys(geoData.features[0].properties).filter(
        (key) => typeof geoData.features[0].properties[key] === "number"
      )
    : [];

  if (error) {
    return <Alert message="Error loading data" description={error} type="error" showIcon />;
  }

  if (!geoData) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Spin size="large" tip="Loading map data..." />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>

    {/*}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
        <Select
          value={selectedProperty}
          onChange={(value) => setSelectedProperty(value)}
          style={{ width: 200 }}
          disabled={!availableProperties.length}
        >
          {availableProperties.map((prop) => (
            <Option key={prop} value={prop}>
              {prop}
            </Option>
          ))}
        </Select>
      </div>
      */}

      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {renderGeoJSON()}
      </MapContainer>
    </div>
  );
};

export default ChoroplethMap;
