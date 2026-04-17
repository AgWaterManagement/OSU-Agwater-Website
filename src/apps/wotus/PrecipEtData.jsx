import { useEffect, useState } from 'react';
import { Typography, Spin, Card, Statistic, Button, Divider, Alert, Tag } from 'antd';
import { CloseOutlined, EnvironmentOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { secrets } from '../../secrets';

const { Title, Text } = Typography;

const API_URL = 'https://agwater.org:5556/wotus/precipitation_et_stats';

/**
 * Component that displays the difference between precipitation and
 * evapotranspiration (ET) for a map-clicked location.
 * Rendered below the map at full width.
 *
 * Props:
 *   clickedLocation  – { lat: number, lon: number }
 *   onClearLocation   – callback to dismiss the panel
 */
const PrecipEtData = ({ clickedLocation, onClearLocation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

    useEffect(() => {
        if (!clickedLocation) return;

        const { lat, lon } = clickedLocation;
        setLoading(true);
        setError(null);
        setData(null);

        fetch(`${API_URL}?lat=${lat}&lon=${lon}`, {
            headers: { 'X-API-Key': secrets.agwater_api_key }
        })
            .then(res => {
                if (!res.ok) throw new Error(`Server responded with ${res.status}`);
                return res.json();
            })
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'API returned an unsuccessful response');
                }
                setData(result.data);
            })
            .catch(err => {
                console.error('Error fetching precipitation/ET data:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [clickedLocation]);

    // ---------- Build chart data from the API response ----------
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Detect whether actual ET values are available at this location.
    const hasActualEt = (() => {
        if (!data) return false;
        const arr = data.Actual_ET ?? data.actual_et ?? data.actual_evapotranspiration;
        if (Array.isArray(arr)) return arr.some(v => v !== null && v !== undefined);
        if (data.monthly) return data.monthly.some(m => (m.actual_et ?? m.actual_evapotranspiration) != null);
        return arr !== null && arr !== undefined;
    })();

    const buildChartData = () => {
        if (!data) return [];

        // The API returns { Precipitation: number[12], ET: number[12] }
        const precipArr = data.Precipitation ?? data.precipitation;
        const potentialEtArr = data.Potential_ET ?? data.potential_et ?? data.potential_evapotranspiration;
        const actualEtArr = data.Actual_ET ?? data.actual_et ?? data.actual_evapotranspiration;

        if (Array.isArray(precipArr) && Array.isArray(potentialEtArr)) {
            return precipArr.map((p, i) => {
                const potential_et = potentialEtArr[i] ?? 0;
                const actual_et = actualEtArr[i] ?? 0;
                return {
                    index: i,
                    name: MONTH_LABELS[i] ?? `M${i + 1}`,
                    Precipitation: p,
                    Potential_ET: potential_et,
                    Actual_ET: actual_et,
                    Difference: p - (hasActualEt ? actual_et : potential_et)
                };
            });
        }

        // Fallback: monthly array of objects
        if (data.monthly && Array.isArray(data.monthly)) {
            return data.monthly.map((m, i) => ({
                index: i,
                name: m.month ?? m.name ?? m.label,
                Precipitation: m.precipitation ?? m.precip ?? 0,
                Potential_ET: m.potential_et ?? m.potential_evapotranspiration ?? 0,
                Actual_ET: m.actual_et ?? m.actual_evapotranspiration ?? 0,
                Difference: (m.precipitation ?? m.precip ?? 0) - (hasActualEt
                    ? (m.actual_et ?? m.actual_evapotranspiration ?? 0)
                    : (m.potential_et ?? m.potential_evapotranspiration ?? 0))
            }));
        }

        // Flat single-period response
        const precip = Number(precipArr) || 0;
        const potential_et = Number(potentialEtArr) || 0;
        const actual_et = Number(actualEtArr) || 0;
        return [{ index: 0, name: 'Annual', Precipitation: precip, Potential_ET: potential_et, Actual_ET: actual_et, Difference: precip - (hasActualEt ? actual_et : potential_et) }];
    };

    const chartData = buildChartData();

    // Build ReferenceArea bands for wet (blue) and dry (red) seasons.
    //
    // WHY index-based (numeric) boundaries instead of category-label strings:
    //   On a categorical XAxis, Recharts maps each label to the *centre* of
    //   that tick's column.  Using x1="Jan" therefore starts the band at the
    //   centre of Jan, leaving the left half of January's column uncolored.
    //   At small window widths this gap is only a few pixels and invisible;
    //   at full browser width each month column can be 80-100 px wide, making
    //   the half-column gap obvious and the first wet band appear missing.
    //
    //   By switching the XAxis to type="number" and using half-integer
    //   boundaries (startIndex - 0.5 → endIndex + 0.5) every band covers its
    //   months precisely and completely, regardless of chart width.
    //
    //   Wet and dry opacities are normalised *independently* so that both
    //   seasons always use the full opacity range and remain clearly visible
    //   even when wet |P − ET| values are much smaller than dry ones.
    const buildReferenceAreas = () => {
        if (chartData.length === 0) return [];

        const MIN_OPACITY = 0.18;
        const MAX_OPACITY = 0.50;

        // Separate max |diff| for wet and dry so each type spans the full
        // opacity range independently.
        const etKey = hasActualEt ? 'Actual_ET' : 'Potential_ET';
        const maxWetDiff = Math.max(
            ...chartData.filter(d => d.Precipitation >= d[etKey]).map(d => d.Difference),
            0.001
        );
        const maxDryDiff = Math.max(
            ...chartData.filter(d => d[etKey] > d.Precipitation).map(d => Math.abs(d.Difference)),
            0.001
        );

        const areas = [];
        let start = 0;
        let wet = chartData[0].Precipitation >= chartData[0][etKey];

        for (let i = 1; i <= chartData.length; i++) {
            const atEnd = i === chartData.length;
            const curWet = atEnd ? null : chartData[i].Precipitation >= chartData[i][etKey];

            if (atEnd || curWet !== wet) {
                // Average |diff| for months in this group, normalised against
                // the relevant (wet or dry) maximum.
                let sumDiff = 0;
                for (let j = start; j < i; j++) sumDiff += Math.abs(chartData[j].Difference);
                const avgDiff = sumDiff / (i - start);
                const normalised = avgDiff / (wet ? maxWetDiff : maxDryDiff);
                const fillOpacity = MIN_OPACITY + normalised * (MAX_OPACITY - MIN_OPACITY);

                // Half-integer boundaries ensure band covers full month columns,
                // not just the area between tick centres.
                areas.push({
                    x1: start - 0.5,
                    x2: (i - 1) + 0.5,
                    fill: wet ? '#1890ff' : '#9ea100',
                    fillOpacity,
                    isWet: wet
                });

                start = i;
                wet = curWet;
            }
        }
        return areas;
    };

    // Summary values (aggregate)
    const totalPrecip = chartData.reduce((s, d) => s + d.Precipitation, 0);
    const totalPotentialET = chartData.reduce((s, d) => s + d.Potential_ET, 0);
    const totalActualET = hasActualEt ? chartData.reduce((s, d) => s + d.Actual_ET, 0) : null;
    const totalDiff = totalPrecip - (hasActualEt ? totalActualET : totalPotentialET);

    // Include the name of the stream, if a stream was selected.
    return (
        <Card
            size="small"
            title={
                <span>
                    <EnvironmentOutlined style={{ marginRight: 6 }} />
                    Long Term Average Precipitation &amp; Potential ET
                </span>
            }
            extra={
                onClearLocation && (
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onClearLocation}
                    />
                )
            }
            styles={{ body: { padding: '12px' } }}
            style={{ marginTop: 12 }}
        >
            {/* Location tag */}
            <Tag color="blue" style={{ marginBottom: 8 }}>
                {clickedLocation.lat.toFixed(4)}, {clickedLocation.lon.toFixed(4)}
            </Tag>

            <Spin spinning={loading}>
                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message="Failed to load data"
                        description={error}
                        style={{ marginBottom: 12 }}
                    />
                )}

                {data && (
                    <>
                        {/* Summary statistics */}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                            <Statistic
                                title={<Text style={{ color: 'white', fontSize: 12 }}>Precipitation</Text>}
                                value={formatter.format(totalPrecip)}
                                suffix="in"
                                valueStyle={{ fontSize: 16, color: '#1890ff' }}
                            />
                            <Statistic
                                title={<Text style={{ color: 'white', fontSize: 12 }}>Potential ET</Text>}
                                value={formatter.format(totalPotentialET)}
                                suffix="in"
                                valueStyle={{ fontSize: 16, color: '#fa8c16' }}
                            />
                            {hasActualEt && (
                                <Statistic
                                    title={<Text style={{ color: 'white', fontSize: 12 }}>Actual ET</Text>}
                                    value={formatter.format(totalActualET)}
                                    suffix="in"
                                    valueStyle={{ fontSize: 16, color: '#9ea100' }}
                                />
                            )}
                            <Statistic
                                title={<Text style={{ color: 'white', fontSize: 12 }}>{hasActualEt ? 'P − ETa' : 'P − ETp'}</Text>}
                                value={formatter.format(totalDiff)}
                                suffix="in"
                                valueStyle={{
                                    fontSize: 16,
                                    color: totalDiff >= 0 ? '#52c41a' : '#f5222d'
                                }}
                            />
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        {/* Line chart */}
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    {buildReferenceAreas().map((area, idx) => (
                                        <ReferenceArea
                                            key={idx}
                                            x1={area.x1}
                                            x2={area.x2}
                                            fill={area.fill}
                                            fillOpacity={area.fillOpacity}
                                            strokeOpacity={0}
                                            label={{
                                                value: area.isWet ? 'Wet Season' : 'Dry Season',
                                                position: 'insideTop',
                                                fill: area.fill,
                                                fontSize: 11,
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ))}
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="index"
                                        type="number"
                                        domain={[-0.5, chartData.length - 0.5]}
                                        ticks={chartData.map(d => d.index)}
                                        tickFormatter={(v) => MONTH_LABELS[v] ?? `M${v + 1}`}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value) => `${Number(value).toFixed(2)} in`}
                                        labelStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                    <Line type="monotone" dataKey="Precipitation" stroke="#1890ff" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="Potential_ET" stroke="#fa8c16" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    {hasActualEt && <Line type="monotone" dataKey="Actual_ET" stroke="#9ea100" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }} />}
                                    <Line type="monotone" dataKey="Difference" name={hasActualEt ? 'P − ETa' : 'P − ETp'} stroke="#52c41a" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                                {totalDiff >= 0
                                    ? 'Precipitation exceeds ET at this location.'
                                    : 'ET exceeds precipitation at this location.'}
                            </Text>
                        )}
                    </>
                )}

                {!data && !error && !loading && (
                    <Text type="secondary">Click a location on the map to view precipitation and ET data.</Text>
                )}
            </Spin>
        </Card>
    );
};

PrecipEtData.propTypes = {
    clickedLocation: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lon: PropTypes.number.isRequired
    }).isRequired,
    onClearLocation: PropTypes.func
};

export default PrecipEtData;
