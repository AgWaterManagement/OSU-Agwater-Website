import React from 'react';

const MEASUREMENT_LABELS = {
    PREC: 'Precipitation Accumulation',
    WTEQ: 'Snow Water Equivalent',
    RESC: 'Reservoir Storage'
};

const formatAsOfDate = (dateValue) => {
    if (!dateValue) return null;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString();
};

const renderValue = (measurement) => {
    if (!measurement || measurement.value == null) return 'N/A';
    return `${measurement.value}${measurement.unit ? ` ${measurement.unit}` : ''}`;
};

export default function SummaryPanel({ clickedLocation, stationData, measurementData }) {
    const stations = stationData?.stations || [];

    if (clickedLocation?.lat == null || clickedLocation?.lng == null) {
        return (
            <div className="card fill-height flex-center empty-state">
                <h3 style={{ color: '#FFFF00' }}>No Map Location Selected</h3>
                <p>Click on the map to load nearest stations and drought-related measurements.</p>
            </div>
        );
    }

    if (stationData == null) {
        return (
            <div className="card fill-height flex-center empty-state">
                <p>Loading nearest station metadata...</p>
            </div>
        );
    }

    if (stations.length === 0) {
        return (
            <div className="card fill-height flex-center empty-state">
                <h3 style={{ color: '#FFFF00' }}>No Nearby Stations</h3>
                <p>No drought-index stations were found near the selected map location.</p>
            </div>
        );
    }

    const measurementsByTriplet = new Map(
        (measurementData?.stations || []).map((s) => [s.stationTriplet, s.latestMeasurements || {}])
    );

    const preferredOrder = ['PREC', 'WTEQ', 'RESC'];
    const categorySet = new Set();

    stations.forEach((station) => {
        (station.elements || []).forEach((code) => categorySet.add(code));
    });

    const categoryCodes = [
        ...preferredOrder.filter((code) => categorySet.has(code)),
        ...[...categorySet].filter((code) => !preferredOrder.includes(code)).sort()
    ];

    return (
        <div className="card fill-height" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <h3 style={{ color: '#FFFF00', margin: 0 }}>Nearest Drought Monitoring Stations</h3>
                <p style={{ color: '#AAAAAA', margin: '4px 0 0 0' }}>
                    Clicked location: {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                </p>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                    alignItems: 'start'
                }}
            >
                {categoryCodes.map((code) => {
                    const stationsWithCategory = stations.filter((station) =>
                        (station.elements || []).includes(code)
                    );

                    return (
                        <details
                            key={code}
                            style={{
                                background: '#2A3C4F',
                                borderRadius: '8px',
                                borderLeft: '4px solid #00e5ff',
                                overflow: 'hidden'
                            }}
                        >
                            <summary
                                style={{
                                    listStyle: 'none',
                                    cursor: 'pointer',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}
                            >
                                <div style={{ color: '#FFF', fontWeight: 'bold' }}>
                                    {MEASUREMENT_LABELS[code] || code} ({code})
                                </div>
                                <div style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                                    {stationsWithCategory.length} station{stationsWithCategory.length === 1 ? '' : 's'}
                                </div>
                            </summary>

                            <div
                                style={{
                                    padding: '0 12px 12px 12px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: '6px'
                                }}
                            >
                                {stationsWithCategory.map((station) => {
                                    const latestMeasurements =
                                        measurementsByTriplet.get(station.stationTriplet) || {};
                                    const measurement = latestMeasurements[code];
                                    const asOf = formatAsOfDate(measurement?.date);

                                    return (
                                        <div
                                            key={`${code}-${station.stationTriplet || station.stationId}`}
                                            style={{
                                                background: '#1E2D3D',
                                                borderRadius: '6px',
                                                padding: '8px 10px'
                                            }}
                                        >
                                            <div style={{ color: '#FFF', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                                {station.stationName}
                                            </div>
                                            <div style={{ color: '#AAAAAA', fontSize: '0.8rem', marginTop: '2px' }}>
                                                Station ID: {station.stationId} | Distance: {station.distanceKm ?? 'N/A'} km
                                            </div>
                                            <div style={{ color: '#FFF', fontSize: '1rem', fontWeight: 'bold', marginTop: '4px' }}>
                                                {renderValue(measurement)}
                                            </div>
                                            <div style={{ color: '#718096', fontSize: '0.72rem' }}>
                                                {asOf ? `As of ${asOf}` : 'Date unavailable'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    );
                })}
            </div>

            {categoryCodes.length === 0 && (
                <div style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                    No measurement metadata available for nearby stations.
                </div>
            )}
        </div>
    );
}
