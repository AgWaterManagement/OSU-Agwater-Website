import React, { useEffect, useMemo, useState } from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const ELEMENT_CODES = ['PREC', 'WTEQ', 'RESC'];

const ELEMENT_LABELS = {
    PREC: 'Precipitation Accumulation (PREC)',
    WTEQ: 'Snow Water Equivalent (WTEQ)',
    RESC: 'Reservoir Storage (RESC)'
};

function formatStartOfToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseElementCode(series) {
    return (
        series?.stationElement?.elementCode ||
        series?.elementCode ||
        series?.stationElement?.elementCd ||
        series?.elementCd ||
        null
    );
}

function getLatestValue(values) {
    const valid = (values || []).filter((v) => v?.value !== null && v?.value !== undefined);
    return valid.length > 0 ? valid[valid.length - 1] : null;
}

function computeStatewideAverages(dataRows) {
    const totals = {
        PREC: { sum: 0, count: 0, unit: null },
        WTEQ: { sum: 0, count: 0, unit: null },
        RESC: { sum: 0, count: 0, unit: null }
    };

    (dataRows || []).forEach((entry) => {
        (entry?.data || []).forEach((series) => {
            const code = parseElementCode(series);
            if (!code || !ELEMENT_CODES.includes(code)) return;

            const latest = getLatestValue(series?.values);
            const numericValue = Number(latest?.value);
            if (!Number.isFinite(numericValue)) return;

            totals[code].sum += numericValue;
            totals[code].count += 1;
            totals[code].unit = totals[code].unit || series?.unitCode || series?.unit || null;
        });
    });

    return ELEMENT_CODES.reduce((acc, code) => {
        const total = totals[code];
        acc[code] = {
            average: total.count > 0 ? total.sum / total.count : null,
            unit: total.unit,
            stationCount: total.count
        };
        return acc;
    }, {});
}

function formatAverage(value) {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function StatewideDroughtStatus() {
    const [averages, setAverages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const startDate = useMemo(() => formatStartOfToday(), []);

    useEffect(() => {
        const fetchStatewideDroughtData = async () => {
            try {
                setLoading(true);
                setError(null);

                const dataUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data';
                const dataParams = new URLSearchParams({
                    stationTriplets: '*:OR:*',
                    elements: ELEMENT_CODES.join(','),
                    duration: 'DAILY',
                    returnFlags: 'false',
                    startDate: 0,    // A startDate of 0 will return data from the current date.
                    periodRef: 'START'  // Indicatres that we want to retrieve the station data for the start of the period (today).
                    // beginDate: startDate,
                    // endDate: startDate
                });

                const response = await fetch(`${dataUrl}?${dataParams.toString()}`, {
                    headers: { Accept: 'application/json' }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch statewide drought indices (${response.status})`);
                }

                const dataJson = await response.json();
                const statewideAverages = computeStatewideAverages(dataJson);
                setAverages(statewideAverages);
            } catch (err) {
                console.error('Error fetching statewide drought indices:', err);
                setError('Unable to load statewide drought index values right now.');
                setAverages(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStatewideDroughtData();
    }, [startDate]);

    return (
        <div className="card fill-height" style={{ padding: '12px' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
                <h3 style={{ color: '#FFFF00', margin: 0 }}>Statewide Drought Index Averages (Oregon)</h3>
                <p style={{ color: '#AAAAAA', margin: '4px 0 0 0' }}>Data date: {startDate} (start of day)
                </p>
            </div>

            {loading && <p style={{ color: '#AAAAAA', margin: 0 }}>Loading statewide drought index values...</p>}

            {!loading && error && <p style={{ color: '#FF8A80', margin: 0 }}>{error}</p>}

            {!loading && !error && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px'
                    }}
                >
                    {ELEMENT_CODES.map((code) => {
                        const metric = averages?.[code] || { average: null, unit: null, stationCount: 0 };
                        return (
                            <div
                                key={code}
                                style={{
                                    background: '#1E2D3D',
                                    borderLeft: '4px solid #00e5ff',
                                    borderRadius: '8px',
                                    padding: '10px 12px'
                                }}
                            >
                                <div style={{ color: '#AAAAAA', fontSize: '0.82rem' }}>{ELEMENT_LABELS[code]}</div>
                                <div style={{ color: '#FFF', fontSize: '1.15rem', fontWeight: 'bold', marginTop: '3px' }}>
                                    {formatAverage(metric.average)}
                                    {metric.unit ? ` ${metric.unit}` : ''}
                                </div>
                                <div style={{ color: '#718096', fontSize: '0.75rem', marginTop: '3px' }}>
                                    {metric.stationCount} station{metric.stationCount === 1 ? '' : 's'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
