import React, { useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import { Card, Checkbox, Typography } from "antd";
import "leaflet/dist/leaflet.css";

const MAPSERVER_URL = "https://localhost:6001/mapserver/mapserv";
// const MAP_FILE = "D:/MapServer/apps/tutorial/htdocs/example4.map";
// const MAP_FILE = "D:/MapServer/apps/WOTUS/WOTUS_test.map"
const MAP_FILE = "D:/MapServer/apps/WOTUS/WOTUS_test_2.map"

export default function WotusMapServer() {
  const [wotusLayerVisible, setWotusLayerVisible] = useState(true);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <div style={{ flex: 1, height: "100%" }}>
        <MapContainer
          center={[39.8, -98.5]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* MapServer WMS request; equivalent to
              ?map=...&layer=states&layer=hydro&mode=map */}
          {wotusLayerVisible && (
            <WMSTileLayer
              url={`${MAPSERVER_URL}?map=${MAP_FILE}`}
              // layers="continents"
              service="WFS"
              mode="map"
              format="image/png"
              transparent={true}
              version="1.1.1"
            />
          )}
        </MapContainer>
      </div>
      <div style={{ width: 280, padding: 16, overflowY: "auto" }}>
        <Card title="Map Layers" size="small">
          <Checkbox
            checked={wotusLayerVisible}
            onChange={(e) => setWotusLayerVisible(e.target.checked)}
          >
            WOTUS
          </Checkbox>
        </Card>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          Toggle layers to show or hide them on the map.
        </Typography.Paragraph>
      </div>
    </div>
  );
}
