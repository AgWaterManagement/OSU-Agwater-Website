/**
 * OpenETMap.jsx
 * =============
 * React equivalent of map_test_fields_interactive.html
 *
 * Displays agricultural field boundaries (from openet_fields.geojson) colored
 * by a selected variable (Crop Type, Applied Water, Precipitation, Actual ET)
 * for a selected year.  A time-series chart shows the regional aggregate for
 * the selected variable across all available years, with the selected year
 * highlighted in red.
 *
 * Data sources (in /public/apps/smart_tap/):
 *   openet_fields.geojson  – field boundaries with all attribute columns
 *   openet_metadata.json   – metadata (min/max per variable/year),
 *                            cropColors, chartData, center coords
 *
 * Date: January 2026 (Beta)
 * Contact: todd.mcdonnell@oregonstate.edu
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ReferenceLine, ResponsiveContainer, Label
} from 'recharts';
import { Select, Typography } from 'antd';
import 'leaflet/dist/leaflet.css';
import './OpenETMap.css';

const { Text } = Typography;
const { Option } = Select;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOJSON_URL    = '/apps/smart_tap/openet_fields.geojson';
const METADATA_URL   = '/apps/smart_tap/openet_metadata.json';
const MAP_CENTER     = [42.30255822302872, -121.62887548485224];
const MAP_ZOOM       = 12;

const AVAILABLE_VARS = [
    'Crop Type',
    'Applied Water (ac-ft)',
    'Precipitation (in)',
    'Actual ET (in)',
    'Actual ET (ac-ft)',
];

// CDL crop code → readable name (subset of common codes)
const CROP_NAMES = {
    '21': 'Barley', '23': 'Spring Wheat', '24': 'Winter Wheat',
    '27': 'Rye', '28': 'Oats', '36': 'Alfalfa', '37': 'Other Hay',
    '43': 'Potatoes', '47': 'Dry Beans', '49': 'Peas',
    '61': 'Fallow/Idle', '87': 'Wetlands',
    '111': 'Open Water', '121': 'Dev. Open', '131': 'Barren',
    '142': 'Evergreen Forest', '152': 'Shrubland', '176': 'Grassland',
    '190': 'Woody Wetlands', '195': 'Herbaceous Wetlands', '205': 'Triticale',
};

// ---------------------------------------------------------------------------
// Color helpers (match original HTML logic exactly)
// ---------------------------------------------------------------------------

/**
 * Maps a normalised value t ∈ [0,1] to a 5-stop sequential colour ramp.
 * The ramp choice mirrors the original JS getColorScale() function.
 */
function getColorScale(val, min, max, varName) {
    if (val === null || val === undefined || isNaN(val)) return '#cccccc';
    const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
    if (varName.includes('Precipitation')) {
        if (t < 0.2) return '#eff3ff';
        if (t < 0.4) return '#bdd7e7';
        if (t < 0.6) return '#6baed6';
        if (t < 0.8) return '#3182bd';
        return '#08519c';
    }
    if (varName.includes('Actual ET')) {
        if (t < 0.2) return '#edf8e9';
        if (t < 0.4) return '#bae4b3';
        if (t < 0.6) return '#74c476';
        if (t < 0.8) return '#31a354';
        return '#006d2c';
    }
    // Applied Water (red ramp)
    if (t < 0.2) return '#fee5d9';
    if (t < 0.4) return '#fcae91';
    if (t < 0.6) return '#fb6a4a';
    if (t < 0.8) return '#de2d26';
    return '#a50f15';
}

/** CSS gradient string for the legend bar */
function getLegendGradient(varName) {
    if (varName.includes('Precipitation'))
        return 'linear-gradient(to right, #eff3ff, #08519c)';
    if (varName.includes('Actual ET'))
        return 'linear-gradient(to right, #edf8e9, #006d2c)';
    return 'linear-gradient(to right, #fee5d9, #a50f15)';
}

// ---------------------------------------------------------------------------
// Sub-component: keeps the GeoJSON layer in sync with year/variable changes
// without re-mounting the whole map
// ---------------------------------------------------------------------------

function FieldLayer({ geojsonData, selectedYear, selectedVar, metadata, cropColors, onFeatureClick }) {
    const geoJsonRef = useRef(null);
    const styleRef = useRef(null);

    // Compute the style for a single feature
    const styleFeature = useCallback((feature) => {
        const props = feature.properties;
        if (selectedVar === 'Crop Type') {
            const cropVal = String(props[`CROP_${selectedYear}`] ?? '');
            const fill = cropColors[cropVal] ?? '#a9a9a9';
            return { fillColor: fill, color: 'black', weight: 0.5, fillOpacity: 0.7 };
        }
        const meta = metadata?.[selectedYear]?.[selectedVar];
        if (!meta) return { fillColor: 'transparent', color: 'transparent', weight: 0 };
        const val = props[meta.col];
        const fill = getColorScale(val, meta.min, meta.max, selectedVar);
        return { fillColor: fill, color: 'black', weight: 0.5, fillOpacity: 0.8 };
    }, [selectedYear, selectedVar, metadata, cropColors]);

    // Keep styleRef in sync so mouseout always uses the current style
    useEffect(() => {
        styleRef.current = styleFeature;
    }, [styleFeature]);

    // Re-style existing layer when controls change (no remount)
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.setStyle(styleFeature);
        }
    }, [styleFeature]);

    if (!geojsonData) return null;

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => e.target.setStyle({ color: 'yellow', weight: 3 }),
            mouseout:  (e) => {
                const style = styleRef.current?.(feature);
                if (style) e.target.setStyle(style);
            },
            click:     (e) => onFeatureClick(e, feature),
        });
    };

    return (
        <GeoJSON
            key="field-layer"            // stable key avoids remount
            ref={geoJsonRef}
            data={geojsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
        />
    );
}

// ---------------------------------------------------------------------------
// Sub-component: popup on click (uses Leaflet popup via useMap)
// ---------------------------------------------------------------------------

function ClickPopup({ event, feature, selectedYear, selectedVar }) {
    const map = useMap();

    useEffect(() => {
        if (!event || !feature) return;
        const props = feature.properties;
        const fieldId = props['OPENET_ID'] ?? 'Unknown';
        let displayValue = 'N/A';

        if (selectedVar === 'Crop Type') {
            const code = String(props[`CROP_${selectedYear}`] ?? '');
            displayValue = CROP_NAMES[code] ? `${CROP_NAMES[code]} (${code})` : code || 'N/A';
        } else if (selectedVar.includes('Applied Water')) {
            displayValue = `${(props[`AW_${selectedYear}_acft`] ?? 0).toFixed(2)} ac-ft`;
        } else if (selectedVar.includes('Precipitation')) {
            displayValue = `${(props[`PPT_${selectedYear}_in`] ?? 0).toFixed(2)} in`;
        } else if (selectedVar === 'Actual ET (in)') {
            displayValue = `${(props[`ETa_${selectedYear}_in`] ?? 0).toFixed(2)} in`;
        } else if (selectedVar === 'Actual ET (ac-ft)') {
            displayValue = `${(props[`ETa_${selectedYear}_acft`] ?? 0).toFixed(2)} ac-ft`;
        }

        const L = window.L;
        L.popup()
            .setLatLng(event.latlng)
            .setContent(
                `<div style="font-family:sans-serif;font-size:13px;">
                    <b>Field ID:</b> ${fieldId}<br>
                    <b>Year:</b> ${selectedYear}<br>
                    <b>${selectedVar}:</b> ${displayValue}
                 </div>`
            )
            .openOn(map);
    }, [event, feature]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OpenETMap() {
    const [geojsonData,  setGeojsonData]  = useState(null);
    const [metadata,     setMetadata]     = useState(null);
    const [cropColors,   setCropColors]   = useState({});
    const [chartData,    setChartData]    = useState({});
    const [availYears,   setAvailYears]   = useState([]);

    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedVar,  setSelectedVar]  = useState('Applied Water (ac-ft)');

    const [clickEvent,   setClickEvent]   = useState(null);
    const [clickFeature, setClickFeature] = useState(null);
    const [loadError,    setLoadError]    = useState(null);

    // -----------------------------------------------------------------------
    // Fetch data on mount
    // -----------------------------------------------------------------------
    useEffect(() => {
        Promise.all([
            fetch(GEOJSON_URL).then(r => r.json()),
            fetch(METADATA_URL).then(r => r.json()),
        ])
            .then(([geoJSON, meta]) => {
                setGeojsonData(geoJSON);
                setMetadata(meta.metadata);
                setCropColors(meta.cropColors);
                setChartData(meta.chartData);
                const years = Object.keys(meta.metadata).map(Number).sort((a, b) => a - b);
                setAvailYears(years);
                // Default to last available year
                if (years.length > 0) setSelectedYear(years[years.length - 1]);
            })
            .catch(err => {
                console.error('OpenETMap: data load error', err);
                setLoadError('Failed to load map data. Please try again later.');
            });
    }, []);

    // -----------------------------------------------------------------------
    // Derived: legend info for current selection
    // -----------------------------------------------------------------------
    const meta = metadata?.[selectedYear]?.[selectedVar];
    const isCropType = selectedVar === 'Crop Type';

    // -----------------------------------------------------------------------
    // Chart data for recharts
    // -----------------------------------------------------------------------
    const chartPoints = chartData[selectedVar]
        ? chartData[selectedVar].years.map((yr, i) => ({
            year: yr,
            value: chartData[selectedVar].values[i],
          }))
        : [];

    const chartLabel = selectedVar.includes('(ac-ft)')
        ? `${selectedVar} (Sum)`
        : `${selectedVar} (Area-Weighted Avg)`;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    if (loadError) {
        return <div className="openet-error">{loadError}</div>;
    }

    return (
        <div className="openet-root">

            {/* ── Controls panel (top-right overlay) ── */}
            <div className="openet-controls">
                <h4 className="openet-controls-title">Map Controls</h4>

                <div className="openet-control-row">
                    <label className="openet-label">YEAR</label>
                    <Select
                        value={selectedYear}
                        onChange={setSelectedYear}
                        style={{ width: '100%' }}
                        size="small"
                    >
                        {availYears.map(y => (
                            <Option key={y} value={y}>{y}</Option>
                        ))}
                    </Select>
                </div>

                <div className="openet-control-row">
                    <label className="openet-label">VARIABLE</label>
                    <Select
                        value={selectedVar}
                        onChange={setSelectedVar}
                        style={{ width: '100%' }}
                        size="small"
                    >
                        {AVAILABLE_VARS.map(v => (
                            <Option key={v} value={v}>{v}</Option>
                        ))}
                    </Select>
                </div>

                {/* Legend */}
                <div className="openet-legend">
                    <label className="openet-label">LEGEND</label>

                    {isCropType ? (
                        /* Categorical swatch legend */
                        <div className="openet-legend-swatches">
                            {Object.entries(cropColors).map(([code, color]) => (
                                <div key={code} className="openet-swatch-row">
                                    <span
                                        className="openet-swatch"
                                        style={{ background: color }}
                                    />
                                    <span className="openet-swatch-label">
                                        {CROP_NAMES[code] ?? code}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : meta ? (
                        /* Continuous gradient legend */
                        <>
                            <div
                                className="openet-gradient-bar"
                                style={{ background: getLegendGradient(selectedVar) }}
                            />
                            <div className="openet-gradient-labels">
                                <span>{meta.min.toFixed(1)}</span>
                                <span>{meta.max.toFixed(1)}</span>
                            </div>
                        </>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            No data available for {selectedYear}
                        </Text>
                    )}
                </div>

                <div className="openet-footer">
                    Date: January 2026 (Beta)<br />
                    Contact: todd.mcdonnell@oregonstate.edu
                </div>
            </div>

            {/* ── Map ── */}
            <div className="openet-map-container">
                {!geojsonData && (
                    <div className="openet-loading">Loading map data…</div>
                )}
                <MapContainer
                    center={MAP_CENTER}
                    zoom={MAP_ZOOM}
                    className="openet-leaflet-map"
                    preferCanvas
                >
                    {/* Base tiles */}
                    <TileLayer
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxNativeZoom={19}
                        maxZoom={19}
                    />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains="abcd"
                        maxNativeZoom={20}
                        maxZoom={20}
                    />

                    {/* Field polygons */}
                    <FieldLayer
                        geojsonData={geojsonData}
                        selectedYear={selectedYear}
                        selectedVar={selectedVar}
                        metadata={metadata}
                        cropColors={cropColors}
                        onFeatureClick={(e, feature) => {
                            setClickEvent(e);
                            setClickFeature(feature);
                        }}
                    />

                    {/* Click popup */}
                    <ClickPopup
                        event={clickEvent}
                        feature={clickFeature}
                        selectedYear={selectedYear}
                        selectedVar={selectedVar}
                    />
                </MapContainer>
            </div>

            {/* ── Time-series chart ── */}
            <div className="openet-chart-container">
                {chartPoints.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }}>
                                <Label value="Year" offset={-10} position="insideBottom" fontSize={12} />
                            </XAxis>
                            <YAxis tick={{ fontSize: 11 }}>
                                <Label
                                    value={selectedVar}
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle', fontSize: 11 }}
                                />
                            </YAxis>
                            <ChartTooltip
                                formatter={(val) => val !== null ? [val?.toFixed(2), selectedVar] : ['N/A', selectedVar]}
                                labelFormatter={(yr) => `Year: ${yr}`}
                            />
                            {/* Highlight selected year */}
                            <ReferenceLine
                                x={selectedYear}
                                stroke="#ff0000"
                                strokeWidth={2}
                                strokeDasharray="4 3"
                                label={{ value: String(selectedYear), position: 'top', fontSize: 10, fill: '#ff0000' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#333"
                                strokeWidth={2}
                                dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    const isSelected = payload.year === selectedYear;
                                    return (
                                        <circle
                                            key={`dot-${payload.year}`}
                                            cx={cx} cy={cy}
                                            r={isSelected ? 6 : 3}
                                            fill={isSelected ? '#ff0000' : '#333'}
                                            stroke="none"
                                        />
                                    );
                                }}
                                activeDot={{ r: 5 }}
                                name={chartLabel}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="openet-chart-message">
                        No time-series data available for {selectedVar}
                    </div>
                )}
            </div>
        </div>
    );
}
