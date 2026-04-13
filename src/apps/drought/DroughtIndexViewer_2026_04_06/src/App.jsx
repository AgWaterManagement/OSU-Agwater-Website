import React, { useState, useEffect } from 'react';
import DroughtMap from './components/DroughtMap';
import ControlsBar from './components/ControlsBar';
import ChartPanel from './components/ChartPanel';
import SummaryPanel from './components/SummaryPanel';
import ScatterplotPanel from './components/ScatterplotPanel';
import DatasetModal from './components/DatasetModal';
import { queryUnifiedHuc, queryAllHucsLatest } from './services/DuckDBManager';
import './App.css';

export default function App() {
    const [activeLayer, setActiveLayer] = useState('met');
    const [activeMapLayer, setActiveMapLayer] = useState('usdm'); // Map layer vs Plot Category
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
        // Load relative static dictionaries
        fetch('./data/huc8_names.json')
            .then(r => r.json())
            .then(data => setBasinNames(data))
            .catch(e => console.error("Error loading names", e));
        
        fetch('./data/huc8_current_conditions.json')
            .then(r => r.json())
            .then(data => setCurrentConditions(data))
            .catch(e => console.error("Error loading conditions", e));
            
        fetch('./data/huc8_current_forecasts.json')
            .then(r => r.json())
            .then(data => setForecastData(data))
            .catch(e => console.error("Error loading forecasts", e));

        queryAllHucsLatest().then(data => {
            setCurrentConditions(prev => {
                const merged = prev ? { ...prev } : {};
                for (const huc in data) {
                    merged[huc] = { ...merged[huc], ...data[huc] };
                }
                return merged;
            });
        });
    }, []);

    // Fetches unified data to render Chart and Scatterplot components
    useEffect(() => {
        if (!currentHuc) return;
        // eslint-disable-next-line
        setIsFetchingData(true);
        queryUnifiedHuc(currentHuc).then(rows => {
            setUnifiedData(rows);
            setIsFetchingData(false);
        }).catch(err => {
            console.error(err);
            setUnifiedData([]);
            setIsFetchingData(false);
        });
    }, [currentHuc]);

    return (
        <div className="agtap-wrapper">
            {isFetchingData && unifiedData.length === 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999, display: 'flex',
                    flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
                }}>
                    <div className="duckdb-spinner" style={{
                        border: '8px solid rgba(255, 255, 255, 0.1)', borderTop: '8px solid #FFFF00', 
                        borderRadius: '50%', width: '70px', height: '70px', animation: 'spin 1s linear infinite'
                    }}></div>
                    <h2 style={{marginTop: '20px', color: '#FFFF00', fontFamily: 'Arial, sans-serif'}}>Loading Data Engine...</h2>
                    <p style={{color: '#cccccc', maxWidth: '400px', textAlign: 'center'}}>Loading Parquet data files into the browser. The DuckDB engine processes this data locally.</p>
                </div>
            )}
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

                            <div className="card fill-height flex-center">
                                <ScatterplotPanel 
                                    unifiedData={unifiedData}
                                    isFetchingData={isFetchingData}
                                    currentHuc={currentHuc}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
            <DatasetModal isOpen={showDatasetModal} onClose={() => setShowDatasetModal(false)} />
        </div>
    );
}
