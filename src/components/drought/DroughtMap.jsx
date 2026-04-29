import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl, Pane } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { DROUGHT_COLORS, getMapColor, getLegendLabels } from '../../../scripts/drought/mathUtils';

function MapFitter({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);
    return null;
}

export default function DroughtMap({ activeMapLayer, setActiveMapLayer, currentHuc, setCurrentHuc, currentConditions, forecastData }) {
    const [geojsonData, setGeojsonData] = useState(null);
    const [snotelData, setSnotelData] = useState(null);

    useEffect(() => {
        fetch('/drought/data/snotel_stations_average_annual_swe.geojson')
            .then(r => {
                if (!r.ok) throw new Error(`Failed to load SNOTEL data: ${r.status} ${r.statusText}`);
                return r.json();
            })
            .then(data => setSnotelData(data))
            .catch(e => console.error('Error loading SNOTEL data', e));
    }, []);

    useEffect(() => {
        fetch('/drought/data/oregon_huc8.geojson')
            .then(r => {
                if (!r.ok) throw new Error(`Failed to load GeoJSON: ${r.status} ${r.statusText} (${r.url})`);
                return r.json();
            })
            .then(data => setGeojsonData(data))
            .catch(e => console.error('Error loading geojson', e));
    }, []);

    const styleFeature = (feature) => {
        const huc8 = feature.properties.huc8;
        const isActive = currentHuc === huc8;
        
        let fillColor = DROUGHT_COLORS.None;
        let lookupKey = activeMapLayer;

        if (lookupKey === 'forecast_pct_normal' && forecastData && forecastData[huc8]) {
            const fd = forecastData[huc8];
            const p = Object.keys(fd).includes("04-01-09-30") ? "04-01-09-30" : Object.keys(fd)[0];
            try {
                let actualVal = fd[p]?.pct_50;
                fillColor = getMapColor(activeMapLayer, actualVal);
            } catch {
                fillColor = DROUGHT_COLORS.Missing;
            }
        } else if (currentConditions && currentConditions[huc8]) {
            try {
                let actualVal = currentConditions[huc8][lookupKey];
                fillColor = getMapColor(activeMapLayer, actualVal);
            } catch {
                fillColor = DROUGHT_COLORS.Missing;
            }
        }

        return {
            fillColor: fillColor,
            weight: isActive ? 3 : 0.5,
            opacity: 1,
            color: isActive ? '#FFFF00' : '#000000', // Black border; yellow highlight for selected basin
            fillOpacity: isActive ? 0.9 : 0.75
        };
    };

    const onEachFeature = (feature, layer) => {
        layer.on({
            click: () => {
                // Defer state update to allow Leaflet event loop to complete synchronously
                setTimeout(() => setCurrentHuc(feature.properties.huc8), 0);
            }
        });
    };

    if (!geojsonData) return <div className="map-loading" style={{color: '#fff', padding: '20px'}}>Loading GeoSpatial Bounds...</div>;

    const defaultBounds = [
        [41.75, -124.6], // SW corner
        [44.85, -116.4]  // NE corner
    ];

    const labels = getLegendLabels(activeMapLayer);

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 id="map-heading" style={{margin: '0 0 5px 0', color: 'white'}}>Select a Basin</h2>
            <p style={{marginTop: 0, color: '#AAAAAA'}}>Click any HUC-8 watershed on the map to explore its drought history.</p>
            
            <div className="map-layer-controls" style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                    className={`layer-btn ${activeMapLayer === 'streamflow_pctile' ? 'active' : ''}`} 
                    onClick={() => setActiveMapLayer('streamflow_pctile')}
                    style={{ background: activeMapLayer === 'streamflow_pctile' ? '#3182ce' : '#2A3C4F', color: '#fff', border: '1px solid #445566', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >💧 Surface Water Risk</button>
                <button 
                    className={`layer-btn ${activeMapLayer === 'cmi_raw' ? 'active' : ''}`} 
                    onClick={() => setActiveMapLayer('cmi_raw')}
                    style={{ background: activeMapLayer === 'cmi_raw' ? '#975a16' : '#2A3C4F', color: '#fff', border: '1px solid #445566', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >🌾 Crop Moisture Risk</button>
                <button 
                    className={`layer-btn ${activeMapLayer === 'usdm' ? 'active' : ''}`} 
                    onClick={() => setActiveMapLayer('usdm')}
                    style={{ background: activeMapLayer === 'usdm' ? '#d69e2e' : '#2A3C4F', color: '#000', border: '1px solid #445566', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: activeMapLayer === 'usdm' ? 'bold' : 'normal' }}
                >☁️ Overall Drought</button>
            </div>

            <div className="map-wrapper" style={{ minHeight: '450px', height: '45vh', width: '100%', position: 'relative', border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 1000, display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.75)', padding: '6px 10px', borderRadius: '6px', border: '1px solid #444', color: '#fff', fontSize: '0.8rem', flexWrap: 'wrap', maxWidth: '90%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.D4, marginRight: '4px', borderRadius: '2px' }}></div>{labels.d4}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.D3, marginRight: '4px', borderRadius: '2px' }}></div>{labels.d3}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.D2, marginRight: '4px', borderRadius: '2px' }}></div>{labels.d2}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.D1, marginRight: '4px', borderRadius: '2px' }}></div>{labels.d1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.D0, marginRight: '4px', borderRadius: '2px' }}></div>{labels.d0}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.None, marginRight: '4px', borderRadius: '2px', border: '1px solid #555' }}></div>{labels.normal}</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}><div style={{ width: '14px', height: '14px', backgroundColor: DROUGHT_COLORS.Wet, marginRight: '4px', borderRadius: '2px' }}></div>{labels.wet}</div>
                </div>
                <MapContainer center={[43.8, -120.5]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%', backgroundColor: '#000' }}>
                    <ZoomControl position="topleft" />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <GeoJSON 
                        key={`${activeMapLayer}-${currentHuc}-${currentConditions ? 'loaded' : 'loading'}`} // Re-renders GeoJSON when the active layer or data changes
                        data={geojsonData} 
                        style={styleFeature} 
                        onEachFeature={onEachFeature} 
                    />
                    {snotelData && (
                        <GeoJSON
                            key="snotel-stations"
                            data={snotelData}
                            pointToLayer={(feature, latlng) =>
                                L.circleMarker(latlng, {
                                    radius: 5,
                                    fillColor: '#00bfff',
                                    color: '#ffffff',
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.85
                                })
                            }
                            onEachFeature={(feature, layer) => {
                                const { name, average_annual_mean_swe, elevation } = feature.properties;
                                layer.bindTooltip(
                                    `<strong>${name}</strong><br/>Avg Annual SWE: ${average_annual_mean_swe.toFixed(1)} in<br/>Elevation: ${elevation.toLocaleString()} ft`,
                                    { sticky: true }
                                );
                            }}
                        />
                    )}
                    <Pane name="labels" style={{ zIndex: 650, pointerEvents: 'none' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" />
                    </Pane>
                    <MapFitter bounds={defaultBounds} />
                </MapContainer>
            </div>
        </div>
    );
}
