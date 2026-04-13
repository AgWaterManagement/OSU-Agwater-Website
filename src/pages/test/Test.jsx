import { useState, useEffect, useRef } from "react";
import { Row, Col, Button, Form, Input, DatePicker, Divider, Typography, Space, Collapse, message, Select } from "antd";
import { MapContainer, TileLayer, Circle, Marker, Rectangle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const { Title } = Typography;

// Coordinates for London, England
const LONDON_CENTER = [51.5074, -0.1278];

const rectangles = [
  [
    [51.51, -0.14],
    [51.52, -0.12],
  ],
  [
    [51.50, -0.15],
    [51.505, -0.13],
  ],
];

const circles = [
  {
    center: [51.5074, -0.1278],
    radius: 500,
    color: "blue",
  },
  {
    center: [51.509, -0.1],
    radius: 300,
    color: "green",
  },
];

const markers = [
  {
    position: [51.5074, -0.1278],
    popup: "London Center",
  },
  {
    position: [51.515, -0.13],
    popup: "North of London",
  },
  {
    position: [51.503, -0.12],
    popup: "South of London",
  },
];

const Test = () => {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Title level={3}>Leaflet Map - London, England</Title>
      <MapContainer center={LONDON_CENTER} zoom={13} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {rectangles.map((bounds, idx) => (
          <Rectangle key={idx} bounds={bounds} pathOptions={{ color: "red" }}>
            <Popup>Rectangle {idx + 1}</Popup>
          </Rectangle>
        ))}
        {circles.map((circle, idx) => (
          <Circle
            key={idx}
            center={circle.center}
            radius={circle.radius}
            pathOptions={{ color: circle.color, fillOpacity: 0.3 }}
          >
            <Popup>Circle {idx + 1}</Popup>
          </Circle>
        ))}
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            <Popup>{marker.popup}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Test;

