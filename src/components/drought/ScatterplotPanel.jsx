import React, { useState, useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Label
} from 'recharts';
import { getMapColor } from '../../../scripts/drought/mathUtils';

const INDEX_REGISTRY = {
    usdm:       { field: 'USDM',             label: 'USDM',              color: '#d69e2e' },
    pdsi:       { field: 'PDSI',             label: 'PDSI',              color: '#c05621' },
    spi:        { field: 'SPI',              label: 'SPI-3mo',           color: '#2b6cb0' },
    eddi:       { field: 'EDDI',             label: 'EDDI',              color: '#6b46c1' },
    vci:        { field: 'VCI_Raw',          label: 'VCI',               color: '#38a169' },
    vhi:        { field: 'VHI_Raw',          label: 'VHI',               color: '#2f855a' },
    cmi:        { field: 'CMI_Raw',          label: 'CMI',               color: '#975a16' },
    ssmi:       { field: 'SSMI_Raw',         label: 'SSMI',              color: '#0987a0' },
    swe:        { field: 'SWE_Pct_Normal',   label: 'SWE % Normal',      color: '#0bc5ea' },
    streamflow: { field: 'Streamflow_Pctile',label: 'Streamflow Pctile', color: '#3182ce' },
    spi1yr:     { field: 'SPI_1yr',          label: 'SPI-1yr',           color: '#c05621' },
};

function calculateRegression(points) {
    const n = points.length;
    if (n === 0) return null;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const { x, y } of points) {
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (const { x, y } of points) {
        ssTot += Math.pow(y - meanY, 2);
        ssRes += Math.pow(y - (slope * x + intercept), 2);
    }
    const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
    return { slope, intercept, r2 };
}

const CustomDot = ({ cx, cy, fill }) => (
    <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#000" strokeWidth={1} />
);

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div style={{ backgroundColor: '#1C2833', border: '1px solid #445', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.85rem' }}>
            <p style={{ margin: '0 0 4px 0', color: '#FFFF00' }}>{d.date}</p>
            <p style={{ margin: '2px 0' }}>X: {d.x != null ? d.x.toFixed(2) : 'N/A'}</p>
            <p style={{ margin: '2px 0' }}>Y: {d.y != null ? d.y.toFixed(2) : 'N/A'}</p>
        </div>
    );
};

export default function ScatterplotPanel({ unifiedData, isFetchingData }) {
    const [xAxis, setXAxis] = useState('usdm');
    const [yAxis, setYAxis] = useState('pdsi');

    const plotData = useMemo(() => {
        if (!unifiedData || unifiedData.length === 0) return null;
        const regX = INDEX_REGISTRY[xAxis];
        const regY = INDEX_REGISTRY[yAxis];

        const points = [];
        unifiedData.forEach(row => {
            const vx = row[regX.field];
            const vy = row[regY.field];
            if (vx != null && vy != null) {
                points.push({ x: vx, y: vy, date: row.Date, fill: getMapColor(yAxis, vy) });
            }
        });

        if (points.length === 0) return null;

        const regression = calculateRegression(points);
        let regressionLine = null;
        let r2Str = '—';

        if (regression) {
            r2Str = regression.r2.toFixed(3);
            const xMin = Math.min(...points.map(p => p.x));
            const xMax = Math.max(...points.map(p => p.x));
            regressionLine = [
                { x: xMin, y: regression.slope * xMin + regression.intercept },
                { x: xMax, y: regression.slope * xMax + regression.intercept },
            ];
        }

        return { points, regressionLine, r2Str, regX, regY };
    }, [unifiedData, xAxis, yAxis]);

    if (isFetchingData) {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                <p>Waiting for query completion...</p>
            </div>
        );
    }

    if (!plotData) {
        return (
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: '#888' }}>Insufficient data to plot correlation.</p>
            </div>
        );
    }

    const { points, regressionLine, r2Str, regX, regY } = plotData;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#000', padding: '15px 20px', borderBottom: '1px solid #333', borderRadius: '8px 8px 0 0', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: '#AAAAAA', fontSize: '0.9rem' }}>X-Axis:</label>
                    <select
                        value={xAxis}
                        onChange={e => setXAxis(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #555', padding: '6px', borderRadius: '4px', outline: 'none' }}
                    >
                        {Object.keys(INDEX_REGISTRY).map(k => (
                            <option key={k} value={k}>{INDEX_REGISTRY[k].label}</option>
                        ))}
                    </select>
                </div>
                <span style={{ color: '#555' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: '#AAAAAA', fontSize: '0.9rem' }}>Y-Axis:</label>
                    <select
                        value={yAxis}
                        onChange={e => setYAxis(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #555', padding: '6px', borderRadius: '4px', outline: 'none' }}
                    >
                        {Object.keys(INDEX_REGISTRY).map(k => (
                            <option key={k} value={k}>{INDEX_REGISTRY[k].label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginLeft: 'auto', background: 'var(--accent-orange)', color: '#000', padding: '6px 15px', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    R² = {r2Str}
                </div>
            </div>

            <div style={{ flexGrow: 1, minHeight: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                        <XAxis type="number" dataKey="x" name={regX.label} tick={{ fill: '#AAAAAA', fontSize: 11 }}>
                            <Label value={regX.label} position="insideBottom" offset={-10} fill="#AAAAAA" fontSize={12} />
                        </XAxis>
                        <YAxis type="number" dataKey="y" name={regY.label} tick={{ fill: '#AAAAAA', fontSize: 11 }} width={55}>
                            <Label value={regY.label} angle={-90} position="insideLeft" fill="#AAAAAA" fontSize={12} />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter
                            data={points}
                            shape={<CustomDot />}
                            isAnimationActive={false}
                        />
                        {regressionLine && (
                            <Scatter
                                data={regressionLine}
                                line={{ stroke: '#D73F09', strokeWidth: 3, strokeDasharray: '6 3' }}
                                shape={() => null}
                                isAnimationActive={false}
                            />
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
