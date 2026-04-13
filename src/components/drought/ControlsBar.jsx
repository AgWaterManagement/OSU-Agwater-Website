import React from 'react';

export default function ControlsBar({ activeLayer, setActiveLayer }) {
    return (
        <div className="controls-bar">
            <div className="layer-toggle-bar">
                <button 
                    className={`nav-btn ${activeLayer === 'met' ? 'active' : ''}`}
                    onClick={() => setActiveLayer('met')}
                >
                    ☁️ Meteorological
                </button>
                <button 
                    className={`nav-btn ${activeLayer === 'ag' ? 'active' : ''}`}
                    onClick={() => setActiveLayer('ag')}
                >
                    🌾 Agricultural
                </button>
                <button 
                    className={`nav-btn ${activeLayer === 'hydro' ? 'active' : ''}`}
                    onClick={() => setActiveLayer('hydro')}
                >
                    💧 Hydrological
                </button>
            </div>


        </div>
    );
}
