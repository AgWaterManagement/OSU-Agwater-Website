import React, { useEffect, useMemo, useState } from 'react';
import { Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const ELEMENT_CODES = ['PREC', 'WTEQ', 'RESC'];

const ELEMENT_LABELS = {
    PREC: 'Precipitation Accumulation',
    WTEQ: 'Snow Water Equivalent',
    RESC: 'Reservoir Storage'
};

// To allow for the calculation of statewide averages and data retrieval across the Pacific Northwest,
//  we will use the station triplet format for Oregon, Washington, and Idaho.
// The triplet format is "*:STATE:*" where STATE is the two-letter state abbreviation.
const STATION_TRIPLETS = {
    Oregon: "*:OR:*",
    Washington: "*:WA:*",
    Idaho: "*:ID:*"
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
            totals[code].unit = totals[code].unit ||
                series?.stationElement?.storedUnitCode ||
                series?.storedUnitCode ||
                series?.unitCode ||
                series?.unit ||
                null;
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

function computeMultiDayAverages(dataRows) {
    const totals = {
        PREC: { sum: 0, count: 0, unit: null },
        WTEQ: { sum: 0, count: 0, unit: null },
        RESC: { sum: 0, count: 0, unit: null }
    };

    (dataRows || []).forEach((entry) => {
        (entry?.data || []).forEach((series) => {
            const code = parseElementCode(series);
            if (!code || !ELEMENT_CODES.includes(code)) return;

            const unit =
                series?.stationElement?.storedUnitCode ||
                series?.storedUnitCode ||
                series?.unitCode ||
                series?.unit ||
                null;

            (series?.values || []).forEach((v) => {
                const numericValue = Number(v?.value);
                if (!Number.isFinite(numericValue)) return;
                totals[code].sum += numericValue;
                totals[code].count += 1;
                totals[code].unit = totals[code].unit || unit;
            });
        });
    });

    return ELEMENT_CODES.reduce((acc, code) => {
        const total = totals[code];
        acc[code] = {
            average: total.count > 0 ? total.sum / total.count : null,
            unit: total.unit
        };
        return acc;
    }, {});
}

async function fetchTwentyYearAverages() {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    const currentYear = today.getFullYear();
    const dataUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data';

    const yearRequests = Array.from({ length: 20 }, (_, i) => {
        const year = currentYear - 1 - i;
        // Handle Feb 29 → Feb 28 for non-leap years
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const adjustedDay = (month === 1 && day === 29 && !isLeapYear) ? 28 : day;
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
        const params = new URLSearchParams({
            stationTriplets: '*:OR:*',
            elements: ELEMENT_CODES.join(','),
            duration: 'DAILY',
            returnFlags: 'false',
            beginDate: date,
            endDate: date
        });
        return fetch(`${dataUrl}?${params}`, { headers: { Accept: 'application/json' } })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null);
    });

    const results = await Promise.allSettled(yearRequests);
    const allDataRows = results
        .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
        .flatMap(r => r.value);

    return computeStatewideAverages(allDataRows);
}

async function fetchSevenDayAverages() {
    const today = new Date();
    const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    const beginDate = new Date(today);
    beginDate.setDate(today.getDate() - 7);

    const dataUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data';
    const params = new URLSearchParams({
        stationTriplets: '*:OR:*',
        elements: ELEMENT_CODES.join(','),
        duration: 'DAILY',
        returnFlags: 'false',
        beginDate: fmt(beginDate),
        endDate: fmt(endDate)
    });

    const response = await fetch(`${dataUrl}?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return computeMultiDayAverages(data);
}

function formatAverage(value, maxFractionDigits = 2) {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export default function StatewideDroughtStatus() {
    const [averages, setAverages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [twentyYearAverages, setTwentyYearAverages] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [sevenDayAverages, setSevenDayAverages] = useState(null);
    const [loadingSevenDay, setLoadingSevenDay] = useState(true);

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

        const fetchHistoricalData = async () => {
            try {
                setLoadingHistory(true);
                const historical = await fetchTwentyYearAverages();
                setTwentyYearAverages(historical);
            } catch (err) {
                console.error('Error fetching 20-year averages:', err);
                setTwentyYearAverages(null);
            } finally {
                setLoadingHistory(false);
            }
        };

        const fetchSevenDayData = async () => {
            try {
                setLoadingSevenDay(true);
                const sevenDay = await fetchSevenDayAverages();
                setSevenDayAverages(sevenDay);
            } catch (err) {
                console.error('Error fetching 7-day averages:', err);
                setSevenDayAverages(null);
            } finally {
                setLoadingSevenDay(false);
            }
        };

        fetchStatewideDroughtData();
        fetchHistoricalData();
        fetchSevenDayData();
    }, [startDate]);

    return (
        <div className="card fill-height" style={{ padding: '12px' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
                <Title style={{ color: '#FFFF00', margin: 0 }}>Statewide Drought Index Averages (Oregon)</Title>
                <Paragraph style={{ color: '#AAAAAA', margin: '4px 0 0 0' }}>Data date: {startDate} (start of day)</Paragraph>
            </div>

            {loading && <Paragraph style={{ color: '#AAAAAA', margin: 0 }}>Loading statewide drought index values...</Paragraph>}

            {!loading && error && <Paragraph style={{ color: '#FF8A80', margin: 0 }}>{error}</Paragraph>}

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
                        const historical = twentyYearAverages?.[code];
                        const sevenDayAvg = sevenDayAverages?.[code];
                        // const pctChange =
                        //     !loadingHistory &&
                        //     metric.average != null &&
                        //     historical?.average != null &&
                        //     historical.average !== 0
                        //         ? ((metric.average - historical.average) / Math.abs(historical.average)) * 100
                        //         : null;
                        const sevenDayChange =
                            !loadingSevenDay &&
                            metric.average != null &&
                            sevenDayAvg?.average != null &&
                            sevenDayAvg.average !== 0
                                ? ((metric.average - sevenDayAvg.average) / Math.abs(sevenDayAvg.average)) * 100
                                : null;
                        const twentyYearChange =
                            !loadingHistory &&
                            metric.average != null &&
                            historical?.average != null &&
                            historical.average !== 0
                                ? ((metric.average - historical.average) / Math.abs(historical.average)) * 100
                                : null;
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
                                {/* <div style={{ color: '#AAAAAA', fontSize: '0.82rem' }}>{ELEMENT_LABELS[code]}</div> */}
                                {/* <Title level={4} style={{margin: '0 0 6px 0' }}>{ELEMENT_LABELS[code]}</Title> */}
                                <Text style={{ fontSize: '1.2rem' }}>{ELEMENT_LABELS[code]}</Text>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '3px' }}>
                                    {/* <div style={{fontSize: '1.15rem', fontWeight: 'bold' }}>
                                        {formatAverage(metric.average)}
                                        {metric.unit ? ` ${metric.unit}` : ''}
                                    </div> */}
                                    <Text style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {formatAverage(metric.average, 0)}
                                        {metric.unit ? ` ${metric.unit}` : ''}
                                    </Text>
                                    {/* {pctChange !== null && (
                                        <Text style={{ color: pctChange >= 0 ? '#48BB78' : '#FC8181', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                        </Text>
                                    )} */}
                                </div>
                                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                    <Text>7-day avg: </Text>
                                    {loadingSevenDay ? (
                                        <Text>Loading...</Text>
                                    ) : (
                                        <Text style={{ fontWeight: 'bold' }}>
                                            {formatAverage(sevenDayAvg?.average, 0)}
                                            {metric.unit ? ` ${metric.unit}` : ''}
                                        </Text>
                                    )}
                                    {sevenDayChange !== null && (
                                        <Text style={{ color: sevenDayChange >= 0 ? '#48BB78' : '#FC8181', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>
                                            {sevenDayChange >= 0 ? '+' : ''}{sevenDayChange.toFixed(1)}% Change from 7-day avg
                                        </Text>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.9rem', marginTop: '6px', borderTop: '1px solid #2D3748', paddingTop: '6px' }}>
                                    <Text>20-yr avg: </Text>
                                    {loadingHistory ? (
                                        <Text>Loading...</Text>
                                    ) : (
                                        <Text style={{ fontWeight: 'bold' }}>
                                            {formatAverage(historical?.average, 0)}
                                            {metric.unit ? ` ${metric.unit}` : ''}
                                        </Text>
                                    )}
                                    {twentyYearChange !== null && (
                                        <Text style={{ color: twentyYearChange >= 0 ? '#48BB78' : '#FC8181', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>
                                            {twentyYearChange >= 0 ? '+' : ''}{twentyYearChange.toFixed(1)}% Change from 20-yr avg
                                        </Text>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.9rem', marginTop: '3px' }}>
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
