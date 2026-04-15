import React, { useState, useEffect } from 'react';
import DroughtMap from '../../components/drought/DroughtMap';
import ControlsBar from '../../components/drought/ControlsBar';
import ChartPanel from '../../components/drought/ChartPanel';
import SummaryPanel from '../../components/drought/SummaryPanel';
import ScatterplotPanel from '../../components/drought/ScatterplotPanel';
import DatasetModal from '../../components/drought/DatasetModal';
import './DroughtIndexViewer.css';

const DROUGHT_INDEX_LATEST_URL = 'https://agwater.org:5556/drought/latest';
const DROUGHT_INDEX_TIMESERIES_URL = 'https://agwater.org:5556/drought/timeseries';

export default function DroughtIndexViewer() {
    const [activeLayer, setActiveLayer] = useState('met');
    const [activeMapLayer, setActiveMapLayer] = useState('usdm');
    const [timeFilter, setTimeFilter] = useState('all');
    const [currentHuc, setCurrentHuc] = useState(null);
    const [currentConditions, setCurrentConditions] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [basinNames, setBasinNames] = useState({});

    // Shared Data State
    const [unifiedData, setUnifiedData] = useState([]);
    const [isFetchingData, setIsFetchingData] = useState(false);

    // UI Expanders
    const [showHistorical, setShowHistorical] = useState(false);
    const [showDatasetModal, setShowDatasetModal] = useState(false);

    useEffect(() => {
        // Load basin names from static JSON
        fetch('/drought/data/huc8_names.json')
            .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.url}`); return r.json(); })
            .then(data => setBasinNames(data))
            .catch(e => console.error("Error loading names", e));

        // Load forecast data from static JSON
        fetch('/drought/data/huc8_current_forecasts.json')
            .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.url}`); return r.json(); })
            //.then(r => r.json())
            .then(data => setForecastData(data))
            .catch(e => console.error("Error loading forecasts", e));

        // Fetch latest drought indicators for all HUC8s from REST API
        fetch(DROUGHT_INDEX_LATEST_URL)
            .then(r => r.json())
            .then(json => {
                // API wraps the HUC8-keyed data inside a 'data' property
                const conditions = json?.data ?? json;
                setCurrentConditions(conditions);
            })
            .catch(e => console.error("Error loading latest conditions", e));
    }, []);

    // Fetch time-series data for the selected HUC8 via REST API
    useEffect(() => {
        if (!currentHuc) return;
        setIsFetchingData(true);
        setUnifiedData([]);
        fetch(`${DROUGHT_INDEX_TIMESERIES_URL}?huc8=${encodeURIComponent(currentHuc)}`)
            .then(r => r.json())
            .then(rows => {
                // Normalize: API may return {records:[...]}, {data:[...]}, or a plain array
                const normalized = Array.isArray(rows)
                    ? rows
                    : Array.isArray(rows?.records)
                    ? rows.records
                    : Array.isArray(rows?.data)
                    ? rows.data
                    : [];
                setUnifiedData(normalized);
                setIsFetchingData(false);
            })
            .catch(err => {
                console.error(err);
                setUnifiedData([]);
                setIsFetchingData(false);
            });
    }, [currentHuc]);

    return (
        <div className="agtap-wrapper">
            <main className="drought-container">
                <ControlsBar 
                    activeLayer={activeLayer} 
                    setActiveLayer={setActiveLayer}
                />

                <div className="layout-stack">
                    <div className="top-row">
                        <div className="map-column">
                            <DroughtMap 
                                activeMapLayer={activeMapLayer}
                                setActiveMapLayer={setActiveMapLayer}
                                currentHuc={currentHuc}
                                setCurrentHuc={setCurrentHuc}
                                currentConditions={currentConditions}
                                forecastData={forecastData}
                            />
                        </div>

                        <div className="summary-column">
                            <SummaryPanel 
                                currentHuc={currentHuc}
                                hucName={basinNames[currentHuc] || `HUC-8 Basin ${currentHuc}`}
                                currentConditions={currentConditions}
                                forecastData={forecastData}
                                unifiedData={unifiedData}
                                activeLayer={activeLayer}
                                activeMapLayer={activeMapLayer}
                                setActiveMapLayer={setActiveMapLayer}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '10px 0' }}>
                        <button 
                            onClick={() => setShowHistorical(!showHistorical)}
                            style={{ 
                                padding: '12px 24px', fontSize: '1.05rem', background: '#3182ce', 
                                color: 'white', border: '1px solid #2b6cb0', borderRadius: '4px', cursor: 'pointer',
                                display: currentHuc ? 'inline-block' : 'none'
                             }}>
                            {showHistorical ? 'Hide Historical Data ✖' : '📊 Show Historical Timeline & Scatterplot'}
                        </button>
                    </div>

                    {showHistorical && currentHuc && (
                        <>
                            <div className="card fill-height flex-center" style={{paddingTop: '10px'}}>
                                <div style={{width: '100%', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div className="month-filter-container" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label htmlFor="month-filter" style={{ marginRight: '8px', color: '#888', fontWeight: 'bold' }}>Time Filter:</label>
                                        <select 
                                            id="month-filter" 
                                            value={timeFilter}
                                            onChange={(e) => setTimeFilter(e.target.value)}
                                            style={{ padding: '6px', borderRadius: '4px', background: '#2A3C4F', color: '#fff', border: '1px solid #445' }}
                                        >
                                            <option value="all">All Available Data</option>
                                            <option value="1-3">Jan – Mar</option>
                                            <option value="5">May Only</option>
                                            <option value="6">June Only</option>
                                            <option value="7">July Only</option>
                                            <option value="8">August Only</option>
                                            <option value="5-8">May – August</option>
                                            <option value="6-7">June – July</option>
                                        </select>
                                    </div>
                                    <button onClick={() => setShowDatasetModal(true)} style={{
                                        padding: '6px 14px', background: '#ed8936', color: '#fff', 
                                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}>ℹ️ Dataset Details</button>
                                </div>
                                <ChartPanel 
                                    activeLayer={activeLayer} 
                                    unifiedData={unifiedData}
                                    isFetchingData={isFetchingData}
                                    timeFilter={timeFilter} 
                                />
                            </div>

                            {/* <div className="card fill-height flex-center">
                                <ScatterplotPanel 
                                    unifiedData={unifiedData}
                                    isFetchingData={isFetchingData}
                                    currentHuc={currentHuc}
                                />
                            </div> */}
                        </>
                    )}
                </div>
            </main>
            <DatasetModal isOpen={showDatasetModal} onClose={() => setShowDatasetModal(false)} />
        </div>
    );
}
