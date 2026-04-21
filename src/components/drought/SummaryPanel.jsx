import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Label, Cell, LabelList
} from 'recharts';
import { formatPeriod, getForecastColor, calVol } from '../../../scripts/drought/mathUtils';

const CATEGORIES = [
    { id: 'met', label: 'Meteorological', stats: [
        { key: 'usdm',              label: 'US Drought Monitor', units: 'Severity'   },
        { key: 'pdsi',              label: 'PDSI',               units: 'Severity'   },
        { key: 'spi',               label: 'SPI-3mo',            units: 'Severity'   },
        { key: 'eddi',              label: 'EDDI-1mo',           units: 'Severity'   },
    ]},
    { id: 'ag', label: 'Agricultural', stats: [
        { key: 'cmi_raw',           label: 'Crop Moisture',      units: 'Index'      },
        // { key: 'vci_raw',           label: 'VCI',                units: 'Index'      },
        // { key: 'vhi_raw',           label: 'VHI',                units: 'Index'      },
        { key: 'ssmi_raw',          label: 'Soil Moisture',      units: 'Z-Score'    },
    ]},
    { id: 'hydro', label: 'Hydrological', stats: [
        { key: 'streamflow_pctile', label: 'Streamflow',         units: 'Percentile' },
        { key: 'swe_pct_normal',    label: 'SWE',                units: '% Normal'   },
        { key: 'forecast_pct_normal', label: 'Forecast',         units: '% Normal'   },
        { key: 'spi_1yr',           label: 'SPI-1yr',            units: 'Z-Score'    },
    ]},
];

// Maps stat key to the field name returned by the timeseries REST API
const PARQUET_FIELD_MAP = {
    usdm: 'USDM', pdsi: 'PDSI', spi: 'SPI', eddi: 'EDDI',
    vci_raw: 'VCI_Raw', vhi_raw: 'VHI_Raw', cmi_raw: 'CMI_Raw', ssmi_raw: 'SSMI_Raw',
    swe_pct_normal: 'SWE_Pct_Normal', streamflow_pctile: 'Streamflow_Pctile', spi_1yr: 'SPI_1yr',
};

// Maps stat key to the field name returned by the /drought/latest REST API (lowercase)
const LATEST_API_KEY_MAP = {
    usdm: 'usdm', pdsi: 'pdsi', spi: 'spi', eddi: 'eddi',
    vci_raw: 'vci_raw', vhi_raw: 'vhi_raw', cmi_raw: 'cmi_raw', ssmi_raw: 'ssmi_raw',
    swe_pct_normal: 'swe_pct_normal', streamflow_pctile: 'streamflow_pctile', spi_1yr: 'spi_1yr',
};

const ForecastTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0]?.payload;
    return (
        <div style={{ backgroundColor: '#1C2833', border: '1px solid #445', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.85rem' }}>
            <p style={{ margin: '0 0 4px 0', color: '#FFFF00' }}>{d?.name}</p>
            <p style={{ margin: 0 }}>{d?.value}% of Normal</p>
        </div>
    );
};

export default function SummaryPanel({ currentHuc, hucName, currentConditions, forecastData, unifiedData, activeLayer, activeMapLayer, setActiveMapLayer }) {
    if (!currentHuc) {
        return (
            <div className="card fill-height flex-center empty-state">
                <h3 style={{ color: '#FFFF00' }}>No Basin Selected</h3>
                <p>Click any HUC-8 watershed on the map to explore its real-time metrics.</p>
            </div>
        );
    }

    const data = currentConditions ? currentConditions[currentHuc] : null;

    if (!data) {
        return (
            <div className="card fill-height flex-center empty-state">
                <p>Loading real-time conditions...</p>
            </div>
        );
    }

    return (
        <div className="card fill-height" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="basin-info" style={{ marginTop: 0, marginBottom: '20px' }}>
                <h2 className="basin-title" style={{ fontSize: '1.8rem', color: 'var(--accent-orange)', margin: '0 0 5px 0' }}>
                    {hucName}
                </h2>
                <p className="basin-subtitle" style={{ color: '#AAAAAA', margin: 0 }}>HUC-8 ID: {currentHuc}</p>
            </div>

            <div className="stats-categories" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {CATEGORIES.map(cat => {
                    const isFocus = activeLayer === cat.id;
                    return (
                        <div key={cat.id} className="stat-group" style={{ opacity: isFocus ? 1 : 0.6 }}>
                            <h4 style={{
                                margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px',
                                color: isFocus ? 'var(--accent-yellow)' : '#AAAAAA',
                                textTransform: 'uppercase', fontSize: '0.9rem',
                            }}>
                                {cat.label} Conditions
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {cat.stats.map(s => {
                                    let val = null;
                                    let queryDate = null;

                                    // Step 1: Most recent non-null value from timeseries data
                                    const parquetField = PARQUET_FIELD_MAP[s.key];
                                    if (unifiedData && unifiedData.length > 0 && parquetField) {
                                        for (let i = unifiedData.length - 1; i >= 0; i--) {
                                            const v = unifiedData[i][parquetField];
                                            if (v != null) { val = v; queryDate = unifiedData[i].Date; break; }
                                        }
                                    }

                                    // Step 2: Fallback to /drought/latest API data (lowercase keys)
                                    if (val === null && data) {
                                        const latestKey = LATEST_API_KEY_MAP[s.key];
                                        const possibleVal = data[latestKey];
                                        if (possibleVal != null) val = possibleVal;
                                    }

                                    // Step 3: Forecast data for the forecast_pct_normal stat
                                    let dynamicLabel = s.label;
                                    if (s.key === 'forecast_pct_normal' && forecastData && forecastData[currentHuc]) {
                                        const hucForecasts = forecastData[currentHuc];
                                        const periods = Object.keys(hucForecasts);
                                        if (periods.length > 0) {
                                            const p = periods.includes('04-01-09-30') ? '04-01-09-30'
                                                    : periods.includes('03-01-09-30') ? '03-01-09-30'
                                                    : periods[0];
                                            val = hucForecasts[p]?.pct_50 ?? null;
                                            dynamicLabel = `Forecast ${formatPeriod(p)}`;
                                            queryDate = hucForecasts[p]?.publicationDate ?? null;
                                        }
                                    }

                                    const displayVal = typeof val === 'number' ? val.toFixed(2) : (val ?? 'N/A');
                                    let dateLabel = '';
                                    if (queryDate) {
                                        try {
                                            const dObj = new Date(queryDate + 'T00:00:00');
                                            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                            if (!isNaN(dObj.getTime())) {
                                                dateLabel = `As of ${months[dObj.getMonth()]} ${dObj.getDate()}`;
                                            }
                                        } catch { /* ignore */ }
                                    }

                                    return (
                                        <div
                                            key={s.key}
                                            onClick={() => setActiveMapLayer && setActiveMapLayer(s.key)}
                                            style={{
                                                background: activeMapLayer === s.key ? '#1E2D3D' : '#2A3C4F',
                                                cursor: 'pointer', padding: '10px', borderRadius: '6px',
                                                borderLeft: `4px solid ${isFocus ? 'var(--accent-orange)' : '#445566'}`,
                                                boxShadow: activeMapLayer === s.key ? '0 0 0 2px #FFFF00' : 'none',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                            }}
                                        >
                                            <div style={{ fontSize: '0.8rem', color: '#AAAAAA', marginBottom: '2px' }}>{dynamicLabel}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                {displayVal} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#888' }}>{s.units}</span>
                                            </div>
                                            {dateLabel && <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '2px', fontStyle: 'italic' }}>{dateLabel}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Forecast bar chart */}
            {(activeLayer === 'hydro' || ['streamflow_pctile', 'swe_pct_normal', 'forecast_pct_normal', 'spi_1yr'].includes(activeMapLayer))
                && forecastData && forecastData[currentHuc] && (() => {
                const fd = forecastData[currentHuc];
                const p = Object.keys(fd).includes('04-01-09-30') ? '04-01-09-30' : Object.keys(fd)[0];
                const d = fd[p];
                const chartData = [
                    { name: '90% (Drier)',       value: d.pct_90, label: `${d.pct_90}% (${calVol(d.pct_90, d.normal_volume)} TAF)` },
                    { name: '70% Exceedance',    value: d.pct_70, label: `${d.pct_70}% (${calVol(d.pct_70, d.normal_volume)} TAF)` },
                    { name: '50% (Median)',       value: d.pct_50, label: `${d.pct_50}% (${calVol(d.pct_50, d.normal_volume)} TAF)` },
                    { name: '30% Exceedance',    value: d.pct_30, label: `${d.pct_30}% (${calVol(d.pct_30, d.normal_volume)} TAF)` },
                    { name: '10% (Wetter)',       value: d.pct_10, label: `${d.pct_10}% (${calVol(d.pct_10, d.normal_volume)} TAF)` },
                ];
                const xMax = Math.max(150, ...chartData.map(r => r.value || 0)) + 20;
                return (
                    <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <h4 style={{ color: '#3182ce', margin: '0 0 10px 0' }}>Forecast Target: {formatPeriod(p)}</h4>
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={chartData}
                                    margin={{ top: 5, right: 20, left: 110, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        domain={[0, xMax]}
                                        tick={{ fill: '#AAAAAA', fontSize: 10 }}
                                        label={{ value: '% of Normal Volume', position: 'insideBottom', offset: -5, fill: '#AAAAAA', fontSize: 11 }}
                                        height={35}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: '#AAAAAA', fontSize: 10 }}
                                        width={105}
                                    />
                                    <Tooltip content={<ForecastTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <ReferenceLine x={100} stroke="#a0aec0" strokeDasharray="5 5">
                                        <Label value="Normal (100%)" position="top" fill="#a0aec0" fontSize={10} />
                                    </ReferenceLine>
                                    <Bar dataKey="value" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                                        {chartData.map((entry, idx) => (
                                            <Cell key={idx} fill={getForecastColor(entry.value)} />
                                        ))}
                                        <LabelList
                                            dataKey="label"
                                            position="right"
                                            style={{ fill: '#CCCCCC', fontSize: '0.75rem' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
