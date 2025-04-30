import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GeoJsonMap = ({ geoJsonUrl, zoom = 2, xCenter = 0, yCenter = 0, height = 520,
    styleFn = null, /*
    minVal = 0, maxVal = 1, cmap=null,*/ showZoomControl = true, allowScroll = true }) => {

    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertyOptions, setPropertyOptions] = useState([]);

    useEffect(() => {
        console.log('fetching geojson data from', geoJsonUrl);
        fetch(geoJsonUrl)
            .then((response) => response.json())
            .then((data) => {
                //geoJsonData.current = data;
                setGeoJsonData(data);
                if (data.features.length > 0) {
                    console.log('data.features[0].properties', data.features[0].properties);
                    const properties = Object.keys(data.features[0].properties);
                    setPropertyOptions(properties);
                    setSelectedProperty(properties[0]); // Default to first property
                }
            })
            .catch((error) => console.error("Error fetching GeoJSON:", error));
    }, [geoJsonUrl]);

    const getColor = (value) => {
        if (!value) return "#ccc";
        if (cmap === null) return value > (minVal + maxVal) / 2 ? "red" : "blue";

        const index = value < minVal ? 0 : value > maxVal ? cmap.length - 1 : Math.floor((value - minVal) / (maxVal - minVal) * cmap.length);
        return cmap[index];
    };

    const onEachFeature = (feature, layer) => {
        if (feature.properties && selectedProperty) {
            const value = feature.properties[selectedProperty];
            //layer.setStyle({
            //    fillColor: getColor(value),
            //    weight: 1,
            //    opacity: 1,
            //    color: "gray",
            //    fillOpacity: 0.7,
            //});
            layer.bindPopup(`${selectedProperty}: ${value}`);
        }
    };


    console.log("Rendering field", selectedProperty, 'of',  geoJsonUrl+": zoom=", zoom, 'xy=', xCenter, yCenter);
    //console.log('geoJsonData', geoJsonData.)
    return (
        <div>
            <select onChange={(e) => setSelectedProperty(e.target.value)} value={selectedProperty}>
                {propertyOptions.map((prop) => (
                    <option key={prop} value={prop}>{prop}</option>
                ))}
            </select>
            <MapContainer style={{ borderStyle: 'solid', borderWidth: 1, borderColor: 'red', height: height + 'px', top: 0, left: 0 }}
                center={[yCenter, xCenter]}
                zoom={zoom}
                zoomControl={showZoomControl}
                scrollWheelZoom={allowScroll}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {geoJsonData &&
                    <GeoJSON data={geoJsonData}
                             onEachFeature={onEachFeature}
                             style={styleFn}
                    />}
            </MapContainer>
        </div>
    );
};

export default GeoJsonMap;
