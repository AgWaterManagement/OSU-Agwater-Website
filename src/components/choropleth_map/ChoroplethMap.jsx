import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ChoroplethMap.css";

// Default color map (red-to-green)
const defaultColorMap = (value, min, max) => {
  const ratio = (value - min) / (max - min || 1);
  const red = Math.floor(255 * ratio);
  const green = Math.floor(255 * (1 - ratio));
  return `rgb(${red}, ${green}, 0)`;
};

// Get min and max values for a given property
const getMinMax = (features, property) => {
  const values = features
    .map((f) => f.properties[property])
    .filter((val) => typeof val === "number");
  return [Math.min(...values), Math.max(...values)];
};


function toSignificantDigits(number, n) {
  if (n <= 0 || !Number.isFinite(number)) {
    throw new Error("Invalid input: 'n' must be a positive integer and 'number' must be finite.");
  }
  return Number(number.toPrecision(n));
}

// Example usage:
//console.log(toSignificantDigits(12345.6789, 3)); // Output: 12300
//console.log(toSignificantDigits(0.00456789, 2)); // Output: 0.0046
//console.log(toSignificantDigits(-987.654, 4));   // Output: -987.7


// Leaflet control to show color legend
const LegendControl = ({ min, max, property, colorMap }) => {
  const map = useMap();

  useEffect(() => {
    if (!property) return;

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      const grades = 5;
      const step = (max - min) / grades;
      const labels = [`<strong>${property}</strong>`];

      for (let i = 0; i <= grades; i++) {
        const val = min + i * step;
        const next = min + (i + 1) * step;
        const color = colorMap(val, min, max);
        const rVal = toSignificantDigits(val, 2);
        const rNext = toSignificantDigits(next, 2);
        labels.push(
          `<div class="box" style="background-color:${color}"> </div> ${rVal}-${rNext}`
        );
      }

      div.innerHTML = labels.join("<br>");
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map, min, max, property, colorMap]);

  return null;
};

/*
function GeoJsonWrapper() {
    const map = useMapEvents({
        click: () => {
            map.locate()
        },
        locationfound: (location) => {
            console.log('location found:', location)
        },
    })
    return (
        <MapContainer center={[50.5, 30.5]} zoom={13}>
            <MyComponent />
        </MapContainer>
    )
}
*/

// Main Component
const ChoroplethMap = ({
    data,
    featureProperty,
    center = [0, 0],
    zoom = 2,
    showLegend = true,
    colorMap = defaultColorMap,
    width = "100%",
    height = "32em",  //100vh
    showZoomControl = true,
    allowScroll = true,
}) => {
  const [min, max] = useMemo(
    () => (data && featureProperty ? getMinMax(data.features, featureProperty) : [0, 0]),
    [data, featureProperty]
  );

  // Memoize styling to avoid stale closures on rerender
  const geoJsonStyle = useMemo(() => {
    return (feature) => {
      const value = feature.properties[featureProperty];
      const fillColor =
        typeof value === "number" ? colorMap(value, min, max) : "#ccc";
      return {
        fillColor,
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7,
      };
    };
  }, [featureProperty, colorMap, min, max]);

  const onEachFeature = useMemo(() => {
    return (feature, layer) => {
      const val = feature.properties[featureProperty];
      layer.bindPopup(`${featureProperty}: ${val}`);
    };
  }, [featureProperty]);


  return (
      <MapContainer center={center} zoom={zoom}
          dragging={false}
          doubleClickZoom={false}
          scrollWheelZoom={allowScroll ? true : false}
          touchZoom={false}
          attributionControl={false}
          zoomControl={showZoomControl?true:false}
          style={{ height: height, maxHeight: height, width: width, display:'inline-block' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {data && featureProperty && (
        <GeoJSON
          key={featureProperty} // Forces re-render on featureProperty change
          data={data}
          style={geoJsonStyle}
          onEachFeature={onEachFeature}
        />
      )}
      {showLegend && (
        <LegendControl
          min={min}
          max={max}
          property={featureProperty}
          colorMap={colorMap}
        />
      )}
    </MapContainer>
  );
};

export default ChoroplethMap;
