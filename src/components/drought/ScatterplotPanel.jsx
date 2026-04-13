import React, { useState, useMemo } from 'react';
import PlotComponent from 'react-plotly.js';
import { getMapColor } from '../../apps/drought/DroughtIndexViewer_2026_04_06/src/utils/mathUtils';

const Plot = PlotComponent.default || PlotComponent;

const INDEX_REGISTRY = {
    usdm:       { field: 'USDM',             label: 'USDM',                 color: '#d69e2e' },
    pdsi:       { field: 'PDSI',             label: 'PDSI',                 color: '#c05621' },
    spi:        { field: 'SPI',              label: 'SPI-3mo',              color: '#2b6cb0' },
    eddi:       { field: 'EDDI',             label: 'EDDI',                 color: '#6b46c1' },
    vci:        { field: 'VCI_Raw',          label: 'VCI',                  color: '#38a169' },
    vhi:        { field: 'VHI_Raw',          label: 'VHI',                  color: '#2f855a' },
    cmi:        { field: 'CMI_Raw',          label: 'CMI',                  color: '#975a16' },
    ssmi:       { field: 'SSMI_Raw',         label: 'SSMI',                 color: '#0987a0' },
    swe:        { field: 'SWE_Pct_Normal',   label: 'SWE % Normal',         color: '#0bc5ea' },
    streamflow: { field: 'Streamflow_Pctile',label: 'Streamflow Pctile',    color: '#3182ce' },
    spi1yr:     { field: 'SPI_1yr',          label: 'SPI-1yr',              color: '#c05621' },
};

function calculateRegression(x, y) {
    if (x.length === 0 || y.length === 0 || x.length !== y.length) return null;
    let n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i]; sumY += y[i];
        sumXY += x[i] * y[i]; sumX2 += x[i] * x[i];
    }
    
    // Prevent divide by zero if all X values are identical
    let denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return null;
    
    let slope = (n * sumXY - sumX * sumY) / denominator;
    let intercept = (sumY - slope * sumX) / n;
    
    let meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        let predicted = slope * x[i] + intercept;
        ssTot += Math.pow(y[i] - meanY, 2);
        ssRes += Math.pow(y[i] - predicted, 2);
    }
    let r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    return { slope, intercept, r2: Math.max(0, r2) };
}

export default function ScatterplotPanel({ unifiedData, isFetchingData }) {
    const [xAxis, setXAxis] = useState('usdm');
    const [yAxis, setYAxis] = useState('pdsi');

    const plotData = useMemo(() => {
        if (!unifiedData || unifiedData.length === 0) return null;

        const regX = INDEX_REGISTRY[xAxis];
        const regY = INDEX_REGISTRY[yAxis];

        // Filter out strict nulls for a clean mathematical regression
        let xVals = [];
        let yVals = [];
        let hoverDates = [];
        let markerColors = [];

        unifiedData.forEach(row => {
            const vx = row[regX.field];
            const vy = row[regY.field];
            if (vx !== null && vx !== undefined && vy !== null && vy !== undefined) {
                xVals.push(vx);
                yVals.push(vy);
                hoverDates.push(row.Date);
                markerColors.push(getMapColor(yAxis, vy));
            }
        });

        if (xVals.length === 0) return null;

        const regression = calculateRegression(xVals, yVals);
        
        const scatterTrace = {
            x: xVals,
            y: yVals,
            text: hoverDates,
            mode: 'markers',
            type: 'scatter',
            name: 'Weekly Data',
            marker: { color: markerColors, size: 6, line: { color: '#000', width: 1 } },
            hovertemplate: `${regX.label}: %{x:.2f}<br>${regY.label}: %{y:.2f}<br>Date: %{text}<extra></extra>`
        };

        const traces = [scatterTrace];
        let r2Str = '—';

        if (regression) {
            r2Str = regression.r2.toFixed(3);
            const xMin = Math.min(...xVals);
            const xMax = Math.max(...xVals);
            
            traces.push({
                x: [xMin, xMax],
                y: [regression.slope * xMin + regression.intercept, regression.slope * xMax + regression.intercept],
                mode: 'lines',
                type: 'scatter',
                name: `Trend (R²=${r2Str})`,
                line: { color: 'var(--accent-orange)', width: 3, dash: 'dot' },
                hoverinfo: 'skip'
            });
        }

        return { traces, r2Str, regX, regY };
    }, [unifiedData, xAxis, yAxis]);

    if (isFetchingData) {
        return (
            <div className="flex-center" style={{ height: '100%', color: 'white' }}>
                <p>Waiting for query completion...</p>
            </div>
        );
    }

    if (!plotData) {
        return (
            <div className="flex-center empty-state" style={{ height: '300px' }}>
                <p style={{color: '#888'}}>Insufficient data to plot correlation for selected parameters.</p>
            </div>
        );
    }

    const darkLayout = {
        title: { text: "Index Comparison Scatterplot", font: { color: '#ffffff' } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#ffffff', family: 'Open Sans' },
        xaxis: { title: plotData.regX.label, gridcolor: '#333333', linecolor: '#555555', tickfont: { color: '#AAAAAA' } },
        yaxis: { title: plotData.regY.label, gridcolor: '#333333', linecolor: '#555555', tickfont: { color: '#AAAAAA' } },
        legend: { orientation: 'h', y: -0.2 },
        margin: { t: 40, r: 20, l: 60, b: 60 },
        autosize: true
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#000', padding: '15px 20px', borderBottom: '1px solid #333', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{color: '#AAAAAA', fontSize: '0.9rem'}}>X-Axis:</label>
                    <select 
                        value={xAxis} 
                        onChange={(e) => setXAxis(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #555', padding: '6px', borderRadius: '4px', outline: 'none' }}
                    >
                        {Object.keys(INDEX_REGISTRY).map(k => <option key={k} value={k}>{INDEX_REGISTRY[k].label}</option>)}
                    </select>
                </div>

                <span style={{color: '#555'}}>vs</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{color: '#AAAAAA', fontSize: '0.9rem'}}>Y-Axis:</label>
                    <select 
                        value={yAxis} 
                        onChange={(e) => setYAxis(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #555', padding: '6px', borderRadius: '4px', outline: 'none' }}
                    >
                        {Object.keys(INDEX_REGISTRY).map(k => <option key={k} value={k}>{INDEX_REGISTRY[k].label}</option>)}
                    </select>
                </div>

                <div style={{marginLeft: 'auto', background: 'var(--accent-orange)', color: '#000', padding: '6px 15px', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.9rem'}}>
                    R² = {plotData.r2Str}
                </div>
            </div>

            <div style={{flexGrow: 1, minHeight: '400px'}}>
                <Plot
                    data={plotData.traces}
                    layout={darkLayout}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false, responsive: true }}
                />
            </div>
        </div>
    );
}
