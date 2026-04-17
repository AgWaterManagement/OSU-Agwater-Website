import React, { useEffect, useState, useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

const INDEX_REGISTRY = {
    usdm:       { field: 'USDM',             label: 'US Drought Monitor',              color: '#d69e2e', unit: 'D0-D4' },
    pdsi:       { field: 'PDSI',             label: 'Palmer Drought Severity Index',              color: '#c05621', unit: 'D0-D4' },
    spi:        { field: 'SPI',              label: '3-Month Standardized Precipitation Index',           color: '#2b6cb0', unit: 'D0-D4' },
    eddi:       { field: 'EDDI',             label: '1-Month Evaporative Demand Drought Index',              color: '#6b46c1', unit: 'D0-D4' },
    // vci:        { field: 'VCI_Raw',          label: 'Vegetation Condition Index',               color: '#38a169', unit: '0-100' },
    // vhi:        { field: 'VHI_Raw',          label: 'Vegetation Health Index',               color: '#2f855a', unit: '0-100' },
    cmi:        { field: 'CMI_Raw',          label: 'Crop Moisture Index',               color: '#975a16', unit: 'index' },
    ssmi:       { field: 'SSMI_Raw',         label: 'Standardized Soil Moisture Index',              color: '#0987a0', unit: 'sigma' },
    swe:        { field: 'SWE_Pct_Normal',   label: 'Snow Water Equivalent % Normal',      color: '#0bc5ea', unit: 'pct'   },
    streamflow: { field: 'Streamflow_Pctile',label: 'Streamflow Pctile', color: '#3182ce', unit: 'pctile'},
    spi1yr:     { field: 'SPI_1yr',          label: '1-Year Standardized Precipitation Index',           color: '#c05621', unit: 'sigma' },
};

const UNIT_AXIS_CONFIG = {
    'D0-D4':  { domain: [0, 5],   label: 'Severity (D0-D4)' },
    '0-100':  { domain: [0, 100], label: 'Index (0-100)'    },
    'index':  { domain: [-5, 5],  label: 'CMI Index'        },
    'pct':    { domain: [0, 250], label: '% of Normal'      },
    'pctile': { domain: [0, 100], label: 'Stream Pctile'    },
    'sigma':  { domain: [-3, 3],  label: 'Std. Dev'         },
};

const CATEGORIES = {
    met:   ['usdm', 'pdsi', 'spi', 'eddi'],
    ag:    ['vci', 'vhi', 'cmi', 'ssmi'],
    hydro: ['swe', 'streamflow', 'spi1yr'],
};

const STROKE_DASHES = ['', '5 5', '10 5', '5 10 2 10'];

function filterDataByMonth(data, filterVal) {
    if (filterVal === 'all') return data;
    const allowedMonths = new Set();
    const parts = filterVal.split('-');
    if (parts.length === 2) {
        for (let m = parseInt(parts[0], 10); m <= parseInt(parts[1], 10); m++) allowedMonths.add(m);
    } else {
        allowedMonths.add(parseInt(filterVal, 10));
    }
    return data.filter(row => {
        if (!row.Date) return false;
        const month = parseInt(row.Date.split('-')[1], 10);
        return allowedMonths.has(month);
    });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// formatDateTick converts "YYYY-MM-DD" to "Month Name - Year" (e.g. "2023-07-01" -> "Jul '23")
const formatDateTick = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length >= 2 ? `${MONTH_NAMES[parseInt(parts[1], 10) - 1]} '${parts[0].slice(2)}` : dateStr;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div style={{ backgroundColor: '#1C2833', border: '1px solid #445', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
            <p style={{ color: '#FFFF00', margin: '0 0 6px 0' }}>{label}</p>
            {payload.map(entry => (
                <p key={entry.dataKey} style={{ color: entry.color, margin: '2px 0' }}>
                    {entry.name}: {entry.value != null ? Number(entry.value).toFixed(2) : 'N/A'}
                </p>
            ))}
        </div>
    );
};

export default function ChartPanel({ activeLayer, unifiedData, isFetchingData, timeFilter }) {
    const [activeIndex, setActiveIndex] = useState(CATEGORIES[activeLayer][0]);

    useEffect(() => {
        setActiveIndex(CATEGORIES[activeLayer][0]);
    }, [activeLayer]);

    const filteredData = useMemo(
        () => filterDataByMonth(unifiedData || [], timeFilter),
        [unifiedData, timeFilter]
    );

    const unitToAxisId = useMemo(() => {
        const reg = INDEX_REGISTRY[activeIndex];
        return reg ? { [reg.unit]: '0' } : {};
    }, [activeIndex]);

    const yAxes = useMemo(() => {
        const reg = INDEX_REGISTRY[activeIndex];
        return reg ? [{ unit: reg.unit, axisId: '0' }] : [];
    }, [activeIndex]);

    if (isFetchingData) {
        return (
            <div style={{ height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                <p style={{ color: '#FFFF00' }}>Loading time-series data...</p>
            </div>
        );
    }

    if (!unifiedData || !Array.isArray(unifiedData) || unifiedData.length === 0) return null;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 20px', backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333', marginBottom: '10px' }}>
                <span style={{ color: '#888', marginRight: '10px', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                    Select Index:
                </span>
                {Object.keys(INDEX_REGISTRY).map(key => {
                    const reg = INDEX_REGISTRY[key];
                    const isActive = activeIndex === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveIndex(key)}
                            style={{
                                padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem',
                                cursor: 'pointer', transition: 'all 0.2s',
                                fontWeight: isActive ? 'bold' : 'normal',
                                color: isActive ? '#000' : reg.color,
                                backgroundColor: isActive ? reg.color : 'transparent',
                                border: `1px solid ${reg.color}`,
                            }}
                        >
                            {reg.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ flexGrow: 1, minHeight: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={filteredData}
                        margin={{ top: 10, right: yAxes.length > 1 ? 70 : 20, left: 10, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                        <XAxis
                            dataKey="Date"
                            tick={{ fill: '#AAAAAA', fontSize: 11 }}
                            tickFormatter={formatDateTick}
                            interval="preserveStartEnd"
                            angle={-35}
                            textAnchor="end"
                            height={55}
                        />
                        {yAxes.map(({ unit, axisId }) => {
                            const conf = UNIT_AXIS_CONFIG[unit] || { domain: ['auto', 'auto'], label: unit };
                            return (
                                <YAxis
                                    key={unit}
                                    yAxisId={axisId}
                                    orientation={axisId === '0' ? 'left' : 'right'}
                                    domain={conf.domain}
                                    tick={{ fill: '#AAAAAA', fontSize: 10 }}
                                    label={{
                                        value: conf.label,
                                        angle: -90,
                                        position: axisId === '0' ? 'insideLeft' : 'insideRight',
                                        fill: '#AAAAAA',
                                        fontSize: 11,
                                        offset: axisId === '0' ? 10 : -10,
                                    }}
                                    width={60}
                                />
                            );
                        })}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px', color: '#AAAAAA' }}
                            formatter={(value) => <span style={{ color: '#CCCCCC' }}>{value}</span>}
                        />
                        {(() => {
                            const reg = INDEX_REGISTRY[activeIndex];
                            if (!reg) return null;
                            return (
                                <Line
                                    key={activeIndex}
                                    yAxisId='0'
                                    type="monotone"
                                    dataKey={reg.field}
                                    name={reg.label}
                                    stroke={reg.color}
                                    strokeWidth={2}
                                    dot={false}
                                    connectNulls={false}
                                    isAnimationActive={false}
                                />
                            );
                        })()}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
