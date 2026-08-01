import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts';
import { Typography } from 'antd';
const { Title, Text, Paragraph } = Typography;

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
    const unitCode = measurement?.storedUnitCode || measurement?.unit || null;
    return `${measurement.value}${unitCode ? ` ${unitCode}` : ''}`;
};

const getStoredUnitCode = (measurement, monthlySeries) => {
    return measurement?.storedUnitCode || measurement?.unit || monthlySeries?.storedUnitCode || monthlySeries?.unit || null;
};

const formatMonthLabel = (dateValue) => {
    if (!dateValue) return dateValue;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const toNumeric = (value) => {
    if (value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

export default function SummaryPanel({ clickedLocation, stationData, measurementData }) {
    const stations = stationData?.stations || [];

    if (clickedLocation?.lat == null || clickedLocation?.lng == null) {
        return (
            <div className="card fill-height flex-center empty-state">
                <Title level={3} style={{ color: '#FFFF00', margin: 0 }}>No Map Location Selected</Title>
                <Text>Click on the map to load nearest stations and drought-related measurements.</Text>
            </div>
        );
    }

    if (stationData == null) {
        return (
            <div className="card fill-height flex-center empty-state">
                <Paragraph>Loading nearest station metadata...</Paragraph>
            </div>
        );
    }

    if (stations.length === 0) {
        return (
            <div className="card fill-height flex-center empty-state">
                <Title level={3} style={{ color: '#FFFF00', margin: 0 }}>No Nearby Stations</Title>
                <Text>No drought-index stations were found near the selected map location.</Text>
            </div>
        );
    }

    const measurementsByTriplet = new Map(
        (measurementData?.stations || []).map((s) => [
            s.stationTriplet,
            {
                latestMeasurements: s.latestMeasurements || {},
                monthlyAverages: s.monthlyAverages || {}
            }
        ])
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
                <Title level={3} style={{ color: '#FFFF00', margin: 0 }}>Nearest Drought Monitoring Stations</Title>
                <Text style={{ color: '#AAAAAA', margin: '4px 0 0 0' }}>
                    Clicked location: {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                </Text>
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
                    const categoryUnitCode = stationsWithCategory
                        .map((station) => measurementsByTriplet.get(station.stationTriplet) || {})
                        .map((entry) => {
                            const latest = entry?.latestMeasurements?.[code];
                            const monthly = entry?.monthlyAverages?.[code];
                            return getStoredUnitCode(latest, monthly);
                        })
                        .find(Boolean);

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
                                <Text strong style={{ color: '#FFF' }}>
                                    {MEASUREMENT_LABELS[code] || code} ({code})
                                </Text>
                                {categoryUnitCode && (
                                    <Text style={{ color: '#93A7BC', fontSize: '0.78rem' }}>
                                        Unit code: {categoryUnitCode}
                                    </Text>
                                )}
                                <Text style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                                    {stationsWithCategory.length} station{stationsWithCategory.length === 1 ? '' : 's'}
                                </Text>
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
                                    const stationMeasurements =
                                        measurementsByTriplet.get(station.stationTriplet) || {};
                                    const latestMeasurements = stationMeasurements.latestMeasurements || {};
                                    const monthlyAverages = stationMeasurements.monthlyAverages || {};
                                    const measurement = latestMeasurements[code];
                                    const asOf = formatAsOfDate(measurement?.date);
                                    const monthlyValues = monthlyAverages[code]?.values || [];
                                    const unitCode = getStoredUnitCode(measurement, monthlyAverages[code]);
                                    const chartData = [...monthlyValues]
                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                        .slice(-365)
                                        .map((m) => ({
                                            month: formatMonthLabel(m.date),
                                            average: toNumeric(m.value)
                                        }));
                                    const currentValue = toNumeric(measurement?.value);

                                    return (
                                        <div
                                            key={`${code}-${station.stationTriplet || station.stationId}`}
                                            style={{
                                                background: '#1E2D3D',
                                                borderRadius: '6px',
                                                padding: '8px 10px'
                                            }}
                                        >
                                            <Paragraph style={{ margin: 0, color: '#FFF', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                                {station.stationName}
                                            </Paragraph>
                                            <Paragraph style={{ margin: '2px 0 0', color: '#AAAAAA', fontSize: '0.8rem' }}>
                                                Station ID: {station.stationId} | Distance: {station.distanceKm ?? 'N/A'} km
                                            </Paragraph>
                                            <Paragraph style={{ margin: '4px 0 0', color: '#FFF', fontSize: '1rem', fontWeight: 'bold' }}>
                                                {renderValue(measurement)}
                                            </Paragraph>
                                            {/* <Paragraph style={{ margin: 0, color: '#93A7BC', fontSize: '0.72rem' }}>
                                                Measurement unit: {unitCode || 'Unknown'}
                                            </Paragraph> */}
                                            <Paragraph style={{ margin: 0, color: '#718096', fontSize: '0.72rem' }}>
                                                {asOf ? `As of ${asOf}` : 'Date unavailable'}
                                            </Paragraph>
                                            {chartData.length > 0 && (
                                                <div style={{ marginTop: '8px', height: '170px', background: '#152331', borderRadius: '6px', padding: '4px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#304355" />
                                                            <XAxis dataKey="month" tick={{ fill: '#B6C2CF', fontSize: 10 }} />
                                                            <YAxis tick={{ fill: '#B6C2CF', fontSize: 10 }} width={35} />
                                                            <Tooltip
                                                                formatter={(value, name) => [
                                                                    value == null ? 'N/A' : `${value}${unitCode ? ` ${unitCode}` : ''}`,
                                                                    name === 'average' ? 'Monthly Avg' : name
                                                                ]}
                                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3f5368' }}
                                                                labelStyle={{ color: '#ffffff' }}
                                                                itemStyle={{ color: '#ffffff' }}
                                                            />
                                                            {currentValue != null && (
                                                                <ReferenceLine
                                                                    y={currentValue}
                                                                    stroke="#FFD166"
                                                                    strokeDasharray="6 4"
                                                                    strokeWidth={2}
                                                                    label={{
                                                                        value: 'Current',
                                                                        fill: '#FFD166',
                                                                        fontSize: 10,
                                                                        position: 'insideTopRight'
                                                                    }}
                                                                />
                                                            )}
                                                            <Line
                                                                type="monotone"
                                                                dataKey="average"
                                                                name="Monthly Avg"
                                                                stroke="#4FC3F7"
                                                                strokeWidth={2}
                                                                dot={{ r: 2, fill: '#4FC3F7' }}
                                                                connectNulls={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            {chartData.length === 0 && (
                                                <Paragraph style={{ margin: '6px 0 0', color: '#718096', fontSize: '0.72rem' }}>
                                                    Monthly average history unavailable.
                                                </Paragraph>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    );
                })}
            </div>

            {categoryCodes.length === 0 && (
                <Text style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>
                    No measurement metadata available for nearby stations.
                </Text>
            )}
        </div>
    );
}
