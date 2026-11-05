import React from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MAPSERVER_URL = "https://localhost:6001/mapserver/mapserv";
// const MAP_FILE = "D:/MapServer/apps/tutorial/htdocs/example4.map";
const MAP_FILE = "D:/MapServer/apps/WOTUS/WOTUS_test.map"

export default function WotusMapServer() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
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
        <WMSTileLayer
          url={`${MAPSERVER_URL}?map=${MAP_FILE}`}
          // layers="continents"
          service="WFS"
          mode="map"
          format="image/png"
          transparent={true}
          version="1.1.1"
        />
      </MapContainer>
    </div>
  );
}
