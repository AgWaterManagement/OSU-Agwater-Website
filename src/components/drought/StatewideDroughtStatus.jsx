import React, { useEffect, useMemo, useState } from 'react';
import { Typography } from 'antd';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const { Title, Text } = Typography;

const ELEMENT_CODES = ['PREC', 'WTEQ', 'RESC'];

const ELEMENT_LABELS = {
    PREC: 'Precipitation Accumulation (PREC)',
    WTEQ: 'Snow Water Equivalent (WTEQ)',
    RESC: 'Reservoir Storage (RESC)'
};

const ELEMENT_COLORS = {
    PREC: '#00e5ff',
    WTEQ: '#69f0ae',
    RESC: '#ff9100'
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatMonthStart(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

function formatMonthLabel(monthKey) {
    const parts = monthKey.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
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

function computeMonthlyStatewideAverages(dataRows) {
    const monthData = {};

    (dataRows || []).forEach((entry) => {
        (entry?.data || []).forEach((series) => {
            const code = parseElementCode(series);
            if (!code || !ELEMENT_CODES.includes(code)) return;

            (series?.values || []).forEach((v) => {
                if (v?.value === null || v?.value === undefined) return;
                const num = Number(v.value);
                if (!Number.isFinite(num)) return;

                const dateStr = v.date || v.dateTime || '';
                const monthKey = dateStr.substring(0, 7);
                if (!monthKey || monthKey.length < 7) return;

                if (!monthData[monthKey]) {
                    monthData[monthKey] = {};
                    ELEMENT_CODES.forEach((c) => (monthData[monthKey][c] = { sum: 0, count: 0 }));
                }
                monthData[monthKey][code].sum += num;
                monthData[monthKey][code].count += 1;
            });
        });
    });

    return Object.keys(monthData)
        .sort()
        .map((monthKey) => {
            const entry = { month: monthKey, label: formatMonthLabel(monthKey) };
            ELEMENT_CODES.forEach((code) => {
                const { sum, count } = monthData[monthKey][code];
                entry[code] = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
            });
            return entry;
        });
}

function computeStatewideLatestDaily(dataRows) {
    const totals = {};
    ELEMENT_CODES.forEach((code) => (totals[code] = { sum: 0, count: 0, unit: null }));

    (dataRows || []).forEach((entry) => {
        (entry?.data || []).forEach((series) => {
            const code = parseElementCode(series);
            if (!code || !ELEMENT_CODES.includes(code)) return;

            const latest = getLatestValue(series?.values);
            if (!latest) return;
            const num = Number(latest.value);
            if (!Number.isFinite(num)) return;

            totals[code].sum += num;
            totals[code].count += 1;
            totals[code].unit = totals[code].unit || series?.unitCode || series?.unit || null;
        });
    });

    const result = {};
    ELEMENT_CODES.forEach((code) => {
        const { sum, count, unit } = totals[code];
        result[code] = {
            average: count > 0 ? parseFloat((sum / count).toFixed(2)) : null,
            unit,
            stationCount: count
        };
    });
    return result;
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1a2332', border: '1px solid #444', padding: '8px 12px', borderRadius: '6px' }}>
            <p style={{ color: '#AAAAAA', margin: '0 0 4px 0', fontSize: '0.82rem' }}>{label}</p>
            {payload.map((entry) =>
                entry.value !== null && entry.value !== undefined ? (
                    <p key={entry.dataKey} style={{ color: entry.color, margin: '2px 0', fontSize: '0.9rem' }}>
                        {entry.name}:{' '}
                        {entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {entry.unit || ''}
                    </p>
                ) : null
            )}
        </div>
    );
}

function ElementChart({ code, monthlyData, dailyAverages }) {
    const color = ELEMENT_COLORS[code];
    const label = ELEMENT_LABELS[code];
    const daily = dailyAverages?.[code];
    const unitStr = daily?.unit ? ` ${daily.unit}` : '';

    const todayMonth = useMemo(() => formatDate(new Date()).substring(0, 7), []);

    const chartData = useMemo(() => {
        if (!monthlyData?.length) return [];
        const data = monthlyData.map((entry) => ({ ...entry }));

        if (daily?.average !== null && daily?.average !== undefined) {
            const idx = data.findIndex((d) => d.month === todayMonth);
            if (idx >= 0) {
                data[idx] = { ...data[idx], [`${code}_daily`]: daily.average };
            } else {
                data.push({
                    month: todayMonth,
                    label: formatMonthLabel(todayMonth),
                    [`${code}_daily`]: daily.average
                });
            }
        }

        return data;
    }, [monthlyData, daily, code, todayMonth]);

    const hasDaily = daily?.average !== null && daily?.average !== undefined;

    if (!chartData.length) {
        return (
            <p style={{ color: '#AAAAAA', fontSize: '0.85rem', marginBottom: '12px' }}>
                No data available for {label}.
            </p>
        );
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '6px'
                }}
            >
                <span style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>{label}</span>
                {hasDaily && (
                    <span style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: '#FFD700' }}>Today&apos;s daily avg: </span>
                        <strong style={{ color }}>
                            {daily.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            {unitStr}
                        </strong>
                        {daily.stationCount > 0 && (
                            <span style={{ color: '#718096', marginLeft: '6px' }}>
                                ({daily.stationCount} stations)
                            </span>
                        )}
                    </span>
                )}
            </div>
            <ResponsiveContainer width="100%" height={185}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: '#AAAAAA', fontSize: 10 }}
                        axisLine={{ stroke: '#444' }}
                        tickLine={{ stroke: '#444' }}
                    />
                    <YAxis
                        tick={{ fill: '#AAAAAA', fontSize: 10 }}
                        axisLine={{ stroke: '#444' }}
                        tickLine={{ stroke: '#444' }}
                        tickFormatter={(v) =>
                            typeof v === 'number'
                                ? v.toLocaleString(undefined, { maximumFractionDigits: 1 })
                                : v
                        }
                        width={58}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '0.72rem', paddingTop: '2px' }}
                        formatter={(value) => <span style={{ color: '#AAAAAA' }}>{value}</span>}
                    />
                    <Line
                        type="monotone"
                        dataKey={code}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                        name="Monthly avg"
                        unit={unitStr}
                    />
                    {hasDaily && (
                        <Line
                            type="monotone"
                            dataKey={`${code}_daily`}
                            stroke="#FFD700"
                            strokeWidth={0}
                            dot={{ r: 7, fill: '#FFD700', stroke: '#FFF', strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                            name="Today's daily avg"
                            unit={unitStr}
                            legendType="circle"
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function StatewideDroughtStatus() {
    const [monthlyData, setMonthlyData] = useState(null);
    const [dailyAverages, setDailyAverages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const endDate = useMemo(() => formatDate(new Date()), []);
    const beginDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return formatMonthStart(d);
    }, []);

    useEffect(() => {
        const dataUrl = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data';
        const commonParams = {
            stationTriplets: '*:OR:*',
            elements: ELEMENT_CODES.join(','),
            returnFlags: 'false'
        };

        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);

                const [monthlyRes, dailyRes] = await Promise.all([
                    fetch(
                        `${dataUrl}?${new URLSearchParams({
                            ...commonParams,
                            duration: 'MONTHLY',
                            beginDate,
                            endDate
                        })}`,
                        { headers: { Accept: 'application/json' } }
                    ),
                    fetch(
                        `${dataUrl}?${new URLSearchParams({
                            ...commonParams,
                            duration: 'DAILY',
                            startDate: 0,    // 0 returns data from the current date
                            periodRef: 'START'
                        })}`,
                        { headers: { Accept: 'application/json' } }
                    )
                ]);

                if (!monthlyRes.ok) throw new Error(`Monthly data fetch failed (${monthlyRes.status})`);
                if (!dailyRes.ok) throw new Error(`Daily data fetch failed (${dailyRes.status})`);

                const [monthlyJson, dailyJson] = await Promise.all([
                    monthlyRes.json(),
                    dailyRes.json()
                ]);

                setMonthlyData(computeMonthlyStatewideAverages(monthlyJson));
                setDailyAverages(computeStatewideLatestDaily(dailyJson));
            } catch (err) {
                console.error('Error fetching statewide drought indices:', err);
                setError('Unable to load statewide drought index values right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [beginDate, endDate]);

    return (
        <div className="card fill-height" style={{ padding: '12px' }}>
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
                <Title level={3} style={{ color: '#FFFF00', margin: 0 }}>
                    Statewide Drought Index Averages (Oregon)
                </Title>
                <Text style={{ color: '#AAAAAA', display: 'block', marginTop: '4px' }}>
                    Monthly statewide averages · {beginDate} to {endDate}
                </Text>
            </div>

            {loading && (
                <p style={{ color: '#AAAAAA', margin: 0 }}>Loading statewide drought index values...</p>
            )}
            {!loading && error && <p style={{ color: '#FF8A80', margin: 0 }}>{error}</p>}

            {!loading && !error && monthlyData && (
                <div>
                    {ELEMENT_CODES.map((code) => (
                        <ElementChart
                            key={code}
                            code={code}
                            monthlyData={monthlyData}
                            dailyAverages={dailyAverages}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
