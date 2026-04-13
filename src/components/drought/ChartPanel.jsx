import React, { useEffect, useState } from 'react';
import PlotComponent from 'react-plotly.js';

const Plot = PlotComponent.default || PlotComponent;

const DB_FILES = {
    met: "./data/huc8_drought_timeseries.parquet",
    ag: "./data/huc8_ag_timeseries.parquet",
    hydro: "./data/huc8_hydro_timeseries.parquet"
};

const UNIT_AXIS_CONFIG = {
    'D0-D4':  { title: 'Severity (D0-D4)',       range: [0, 5],    tickvals: [0,1,2,3,4,5], ticktext: ['0','D0','D1','D2','D3','D4'] },
    '0-100':  { title: 'Index (0-100)',          range: [0, 100]   },
    'index':  { title: 'CMI Index',              range: [-5, 5]    },
    '%':      { title: '% of Normal',            range: [0, 250]   },
    '%ile':   { title: 'Stream Pctile',          range: [0, 100]   },
    'σ':      { title: 'Std. Dev (σ)',           range: [-3, 3]    },
};

const INDEX_REGISTRY = {
    usdm:       { field: 'USDM',             label: 'USDM',                 color: '#d69e2e', unit: 'D0-D4' },
    pdsi:       { field: 'PDSI',             label: 'PDSI',                 color: '#c05621', unit: 'D0-D4' },
    spi:        { field: 'SPI',              label: 'SPI-3mo',              color: '#2b6cb0', unit: 'D0-D4' },
    eddi:       { field: 'EDDI',             label: 'EDDI',                 color: '#6b46c1', unit: 'D0-D4' },
    vci:        { field: 'VCI_Raw',          label: 'VCI',                  color: '#38a169', unit: '0-100' },
    vhi:        { field: 'VHI_Raw',          label: 'VHI',                  color: '#2f855a', unit: '0-100' },
    cmi:        { field: 'CMI_Raw',          label: 'CMI',                  color: '#975a16', unit: 'index' },
    ssmi:       { field: 'SSMI_Raw',         label: 'SSMI',                 color: '#0987a0', unit: 'σ' },
    swe:        { field: 'SWE_Pct_Normal',   label: 'SWE % Normal',         color: '#0bc5ea', unit: '%' },
    streamflow: { field: 'Streamflow_Pctile',label: 'Streamflow Pctile',    color: '#3182ce', unit: '%ile' },
    spi1yr:     { field: 'SPI_1yr',          label: 'SPI-1yr',              color: '#c05621', unit: 'σ' },
};


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorStr: '' };
    }
    static getDerivedStateFromError(error) {
        console.error("ErrorBoundary caught:", error);
        return { hasError: true, errorStr: error.toString() };
    }
    render() {
        if (this.state.hasError) {
            return <div style={{color: 'red', border: '1px solid red', padding: '10px'}}>{this.state.errorStr}</div>;
        }
        return this.props.children;
    }
}

// Separates logic to handle DuckDB date parsing
function filterDataByMonth(values, dates, filterVal) {
    if (filterVal === 'all') return values.slice();
    
    const allowedMonths = new Set();
    const rangeParams = filterVal.split('-');
    if (rangeParams.length === 2) {
        let start = parseInt(rangeParams[0], 10);
        let end = parseInt(rangeParams[1], 10);
        for (let m = start; m <= end; m++) {
            allowedMonths.add(m);
        }
    } else {
        allowedMonths.add(parseInt(filterVal, 10));
    }
    
    return values.map((val, i) => {
        if (val === null || val === undefined || !dates[i]) return null;
        let monthInt;
        
        let targetDate = dates[i];
        if (typeof targetDate === 'bigint') targetDate = Number(targetDate);
        
        if (typeof targetDate === 'string') {
            const parts = targetDate.split('-');
            if (parts.length >= 2) monthInt = parseInt(parts[1], 10);
        } else {
            try { 
                let d = typeof targetDate === 'number' && targetDate < 50000 ? targetDate * 86400000 : targetDate;
                monthInt = new Date(d).getUTCMonth() + 1; 
            } catch { return null; }
        }
        if (allowedMonths.has(monthInt)) {
            // Guarantee pure floats for Plotly
            return typeof val === 'bigint' ? Number(val) : Number(val);
        }
        return null;
    });
}

const CATEGORIES = {
    met:   ['usdm', 'pdsi', 'spi', 'eddi'],
    ag:    ['vci', 'vhi', 'cmi', 'ssmi'],
    hydro: ['swe', 'streamflow', 'spi1yr'],
};

export default function ChartPanel({ activeLayer, unifiedData, isFetchingData, timeFilter }) {
    const [activeChips, setActiveChips] = useState(CATEGORIES[activeLayer]);

    useEffect(() => {
        // Sync macro category toggles down to chips
        setActiveChips(CATEGORIES[activeLayer]);
    }, [activeLayer]);

    const toggleChip = (key) => {
        if (activeChips.includes(key)) {
            setActiveChips(activeChips.filter(c => c !== key));
        } else {
            if (activeChips.length >= 4) {
                // Keep max 4 to avoid chart clutter
                const newChips = [...activeChips];
                newChips.shift();
                newChips.push(key);
                setActiveChips(newChips);
            } else {
                setActiveChips([...activeChips, key]);
            }
        }
    };

    if (isFetchingData) {
        return (
            <div className="flex-center" style={{ height: '100%', color: 'white' }}>
                <h3 style={{color: '#FFFF00'}}>Querying DuckDB-WASM...</h3>
                <p>Loading time-series data...</p>
            </div>
        );
    }

    if (!unifiedData || unifiedData.length === 0) {
        return null;
    }

    const rawDates = unifiedData.map(r => r.Date);

    const dashPatterns = ['solid', 'dot', 'dash', 'dashdot'];

    // Groups active indices by unit to assign the Y-axis
    const unitGroups = {};
    activeChips.forEach(key => {
        const reg = INDEX_REGISTRY[key];
        if (reg) {
            if (!unitGroups[reg.unit]) unitGroups[reg.unit] = [];
            unitGroups[reg.unit].push(key);
        }
    });

    const unitOrder = Object.keys(unitGroups);
    const unitToAxis = {};
    unitOrder.forEach((u, i) => {
        if (i === 0) unitToAxis[u] = 'y';
        else if (i === 1) unitToAxis[u] = 'y2';
        else unitToAxis[u] = 'y3';
    });

    const traces = activeChips.map((key, index) => {
        const reg = INDEX_REGISTRY[key];
        if (!reg) return null;
        
        const rawValues = unifiedData.map(r => r[reg.field]);
        const maskedVals = filterDataByMonth(rawValues, rawDates, timeFilter);
        
        const isSparse = (reg.unit === '%' || reg.unit === '%ile');
        const mode = isSparse ? 'lines+markers' : 'lines';

        // Construct safe trace object
        const traceObj = {
            x: rawDates,
            y: maskedVals,
            name: reg.label,
            type: 'scatter',
            mode: mode,
            yaxis: unitToAxis[reg.unit],
            connectgaps: false,
            line: { 
                color: reg.color, 
                width: 2, 
                dash: dashPatterns[index % dashPatterns.length] 
            },
            hovertemplate: `%{y:.2f} ${reg.unit}<br>%{x}<extra></extra>`
        };
        
        if (mode === 'lines+markers') {
            traceObj.marker = { size: 5, color: reg.color };
        }
        return traceObj;
    }).filter(Boolean);

    const numAxes = unitOrder.length;
    let marginR = 40;
    if (numAxes === 2) marginR = 80;
    if (numAxes >= 3) marginR = 120;

    const darkLayout = {
        title: { text: "Custom Multi-Index Timeline", font: { color: '#ffffff', size: 14 } },
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#ffffff', family: 'Open Sans' },
        xaxis: { 
            gridcolor: '#333333', 
            linecolor: '#555555', 
            tickfont: { color: '#AAAAAA' }
        },
        legend: { orientation: 'h', y: -0.2 },
        margin: { t: 40, r: marginR, l: 60, b: 60 },
        autosize: true
    };

    // Inserts multiple Y-axes based on the selected variables
    unitOrder.forEach((u, i) => {
        const axisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        const conf = UNIT_AXIS_CONFIG[u];
        
        darkLayout[axisKey] = {
            title: conf.title,
            range: conf.range,
            titlefont: { color: '#AAAAAA', size: 11 },
            tickfont: { color: '#AAAAAA', size: 10 },
            gridcolor: i === 0 ? '#333333' : 'rgba(0,0,0,0)',
            linecolor: '#555555',
            zeroline: false
        };
        
        // Only assign string/array configuration if explicitly defined
        if (conf.tickvals) {
             darkLayout[axisKey].tickvals = conf.tickvals;
        }
        if (conf.ticktext) {
             darkLayout[axisKey].ticktext = conf.ticktext;
        }

        if (i > 0) {
            darkLayout[axisKey].overlaying = 'y';
            darkLayout[axisKey].side = 'right';
            if (i >= 2) {
                // strict spacing multiplier
                darkLayout[axisKey].anchor = 'free';
                darkLayout[axisKey].position = 1.0 - (i - 1) * 0.15;
            }
        }
    });

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Interactive Index Chip Controller */}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 20px', backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333', marginBottom: '10px'}}>
                <span style={{color: '#888', marginRight: '10px', display: 'flex', alignItems: 'center', fontSize: '0.9rem'}}>Active Indices (Max 4):</span>
                {Object.keys(INDEX_REGISTRY).map(key => {
                    const reg = INDEX_REGISTRY[key];
                    const isActive = activeChips.includes(key);
                    return (
                        <button 
                            key={key}
                            onClick={() => toggleChip(key)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: isActive ? 'bold' : 'normal',
                                color: isActive ? '#000' : reg.color,
                                backgroundColor: isActive ? reg.color : 'transparent',
                                border: `1px solid ${reg.color}`
                            }}
                        >
                            {reg.label} {isActive ? '×' : '+'}
                        </button>
                    )
                })}
            </div>

            <div style={{flexGrow: 1, minHeight: '400px'}}>
                <ErrorBoundary>
                    <Plot
                        data={traces}
                        layout={darkLayout}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
