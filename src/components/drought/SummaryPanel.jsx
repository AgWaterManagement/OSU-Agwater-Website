import React from 'react';
import PlotComponent from 'react-plotly.js';

const Plot = PlotComponent.default || PlotComponent;

const CATEGORIES = [
    { id: 'met', label: 'Meteorological', stats: [
        { key: 'usdm', label: 'US Drought Monitor', units: 'Severity' },
        { key: 'pdsi', label: 'PDSI', units: 'Severity' },
        { key: 'spi', label: 'SPI-3mo', units: 'Severity' },
        { key: 'eddi', label: 'EDDI-1mo', units: 'Severity' }
    ]},
    { id: 'ag', label: 'Agricultural', stats: [
        { key: 'cmi_raw', label: 'Crop Moisture', units: 'Index' },
        { key: 'vci_raw', label: 'VCI', units: 'Index' },
        { key: 'vhi_raw', label: 'VHI', units: 'Index' },
        { key: 'ssmi_raw', label: 'Soil Moisture', units: 'Z-Score' }
    ]},
    { id: 'hydro', label: 'Hydrological', stats: [
        { key: 'streamflow_pctile', label: 'Streamflow', units: 'Percentile' },
        { key: 'swe_pct_normal', label: 'SWE', units: '% Normal' },
        { key: 'forecast_pct_normal', label: 'Forecast', units: '% Normal' },
        { key: 'spi_1yr', label: 'SPI-1yr', units: 'Z-Score' }
    ]}
];

import { formatPeriod, getForecastColor, calVol } from '../../apps/drought/DroughtIndexViewer_2026_04_06/src/utils/mathUtils';

export default function SummaryPanel({ currentHuc, hucName, currentConditions, forecastData, unifiedData, activeLayer, activeMapLayer, setActiveMapLayer }) {
    if (!currentHuc) {
        return (
            <div className="card fill-height flex-center empty-state">
                  <h3 style={{color: '#FFFF00'}}>No Basin Selected</h3>
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
            <div className="basin-info" style={{marginTop: 0, marginBottom: '20px'}}>
                <h2 className="basin-title" style={{fontSize: '1.8rem', color: 'var(--accent-orange)', margin: '0 0 5px 0'}}>
                    {hucName}
                </h2>
                <p className="basin-subtitle" style={{color: '#AAAAAA', margin: 0}}>HUC-8 ID: {currentHuc}</p>
            </div>

            <div className="stats-categories" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {CATEGORIES.map(cat => {
                    const isFocus = activeLayer === cat.id;
                    return (
                        <div key={cat.id} className="stat-group" style={{ opacity: isFocus ? 1 : 0.6 }}>
                            <h4 style={{ 
                                margin: '0 0 10px 0', 
                                borderBottom: '1px solid #333', 
                                paddingBottom: '5px',
                                color: isFocus ? 'var(--accent-yellow)' : '#AAAAAA',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem'
                            }}>
                                {cat.label} Conditions
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {cat.stats.map(s => {
                                    let val = null;
                                    let queryDate = null;
                                    
                                    // Step 1: Retrieves the most recent non-null value from the Parquet data.
                                    const parquetField = s.key === 'usdm' ? 'USDM' : 
                                                         s.key === 'pdsi' ? 'PDSI' :
                                                         s.key === 'spi' ? 'SPI' :
                                                         s.key === 'eddi' ? 'EDDI' :
                                                         s.key === 'vci_raw' ? 'VCI_Raw' :
                                                         s.key === 'vhi_raw' ? 'VHI_Raw' :
                                                         s.key === 'cmi_raw' ? 'CMI_Raw' :
                                                         s.key === 'ssmi_raw' ? 'SSMI_Raw' :
                                                         s.key === 'swe_pct_normal' ? 'SWE_Pct_Normal' :
                                                         s.key === 'streamflow_pctile' ? 'Streamflow_Pctile' :
                                                         s.key === 'spi_1yr' ? 'SPI_1yr' : null;

                                    if (unifiedData && unifiedData.length > 0 && parquetField) {
                                        for (let i = unifiedData.length - 1; i >= 0; i--) {
                                            const v = unifiedData[i][parquetField];
                                            if (v !== null && v !== undefined) {
                                                val = v;
                                                queryDate = unifiedData[i].Date;
                                                break;
                                            }
                                        }
                                    }

                                    // Step 2: Fallback to the real-time Python extracted dictionary JSON payload if DuckDB is still querying
                                    if (val === null && data) {
                                        let jsonKey = s.key;
                                        if (jsonKey === 'cmi_raw') jsonKey = 'cmi';
                                        if (jsonKey === 'streamflow_pctile') jsonKey = 'streamflow';
                                        
                                        const possibleVal = data[jsonKey];
                                        if (possibleVal !== null && possibleVal !== undefined) {
                                            val = possibleVal;
                                        }
                                    }

                                    // Step 3: Processes Forecast data from the separate JSON payload.
                                    let dynamicLabel = s.label;
                                    if (s.key === 'forecast_pct_normal' && forecastData && forecastData[currentHuc]) {
                                        const hucForecasts = forecastData[currentHuc];
                                        const periods = Object.keys(hucForecasts);
                                        if (periods.length > 0) {
                                            let p = periods.includes("04-01-09-30") ? "04-01-09-30" : 
                                                    periods.includes("03-01-09-30") ? "03-01-09-30" : periods[0];
                                            val = hucForecasts[p]?.pct_50 || null;
                                            dynamicLabel = `Forecast ${formatPeriod(p)}`;
                                            queryDate = hucForecasts[p]?.publicationDate || null;
                                        }
                                    }

                                    // Format Output
                                    if (typeof val === 'number') val = val.toFixed(2);
                                    if (val === null || val === undefined) val = "N/A";

                                    let dateLabel = "";
                                    if (queryDate) {
                                        try {
                                            const dObj = new Date(queryDate + "T00:00:00");
                                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                            if (!isNaN(dObj.getTime())) {
                                                dateLabel = `As of ${months[dObj.getMonth()]} ${dObj.getDate()}`;
                                            }
                                        } catch { /* Ignore missing date parser faults safely */ }
                                    }

                                    return (
                                        <div key={s.key} className="stat-card-custom" 
                                            onClick={() => setActiveMapLayer && setActiveMapLayer(s.key)}
                                            style={{ 
                                            background: activeMapLayer === s.key ? '#1E2D3D' : '#2A3C4F', 
                                            cursor: 'pointer',
                                            padding: '10px', 
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${isFocus ? 'var(--accent-orange)' : '#445566'}`,
                                            boxShadow: activeMapLayer === s.key ? '0 0 0 2px #FFFF00' : 'none',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{fontSize: '0.8rem', color: '#AAAAAA', marginBottom: '2px'}}>{dynamicLabel}</div>
                                            <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF', display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                                                {val} <span style={{fontSize: '0.7rem', fontWeight: 'normal', color: '#888'}}>{s.units}</span>
                                            </div>
                                            {dateLabel && <div style={{fontSize: '0.65rem', color: '#718096', marginTop: '2px', fontStyle: 'italic'}}>{dateLabel}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {(activeLayer === 'hydro' || ['streamflow_pctile', 'swe_pct_normal', 'forecast_pct_normal', 'spi_1yr'].includes(activeMapLayer)) && forecastData && forecastData[currentHuc] && (() => {
                const fd = forecastData[currentHuc];
                const p = Object.keys(fd).includes("04-01-09-30") ? "04-01-09-30" : Object.keys(fd)[0];
                const d = fd[p];
                
                const xVals = [d.pct_90, d.pct_70, d.pct_50, d.pct_30, d.pct_10];
                const yVals = [
                    '90% (Drier)',
                    '70% Exceedance',
                    '50% (Median)',
                    '30% Exceedance',
                    '10% (Wetter)'
                ];
                
                const colors = xVals.map(pct => getForecastColor(pct));
                const textVals = xVals.map(pct => `${pct}% (${calVol(pct, d.normal_volume)} TAF)`);

                return (
                    <div style={{marginTop: '30px', borderTop: '1px solid #333', paddingTop: '15px'}}>
                        <h4 style={{color: '#3182ce', margin: '0 0 10px 0'}}>Forecast Target: {formatPeriod(p)}</h4>
                        <div style={{height: '250px'}}>
                            <Plot
                                data={[{
                                    x: xVals,
                                    y: yVals,
                                    type: 'bar',
                                    orientation: 'h',
                                    marker: { color: colors },
                                    text: textVals,
                                    textposition: 'auto',
                                    hovertemplate: '<b>%{y}</b>: %{text}<extra></extra>'
                                }]}
                                layout={{
                                    margin: { l: 110, r: 20, t: 30, b: 40 },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    font: { color: '#ffffff' },
                                    xaxis: { 
                                        title: '% of Normal Volume',
                                        range: [0, Math.max(150, Math.max(...xVals) + 20)],
                                        zeroline: false,
                                        gridcolor: '#444'
                                    },
                                    yaxis: { autorange: 'reversed' },
                                    shapes: [{
                                        type: 'line',
                                        x0: 100, x1: 100,
                                        y0: -0.5, y1: 4.5,
                                        line: { color: '#a0aec0', width: 2, dash: 'dash' }
                                    }],
                                    annotations: [{
                                        x: 100, y: -0.5,
                                        xref: 'x', yref: 'y',
                                        text: '100% (Normal)',
                                        showarrow: false,
                                        yshift: 15, xshift: 5,
                                        font: { size: 10, color: '#a0aec0' }
                                    }],
                                    autosize: true
                                }}
                                useResizeHandler={true}
                                style={{ width: '100%', height: '100%' }}
                                config={{ displayModeBar: false }}
                            />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
