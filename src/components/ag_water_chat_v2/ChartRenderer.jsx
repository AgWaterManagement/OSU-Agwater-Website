import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Typography } from "antd";

// Ported from SmartTap's web/src/features/smarttap/ChartRenderer.tsx, with the
// TypeScript types removed and Tailwind classes replaced by inline styles, since
// this project doesn't have Tailwind configured. Renders SmartTap's `chart_model`
// (line/bar/pie/donut), or falls back to `fallbackImageUrl` if no chart_model was
// produced. Pass chartModel: null and only a fallbackImageUrl to render just the
// pre-rendered PNG SmartTap sends as chart_image_url.

const { Title } = Typography;

const fallbackPalette = [
    "#4c78a8",
    "#f58518",
    "#54a24b",
    "#e45756",
    "#72b7b2",
    "#b279a2",
    "#ff9da6",
    "#9d755d",
    "#bab0ac",
];

const containerStyle = {
    width: "100%",
    borderRadius: 6,
    border: "1px solid #d9d9d9",
    background: "#ffffff",
    padding: 16,
    marginTop: "0.75em",
};

function valueFormatter(value, format) {
    if (value == null) {
        return "—";
    }
    if (format === "percent" && typeof value === "number") {
        return `${value}%`;
    }
    if (typeof value === "number" || typeof value === "string") {
        return value;
    }
    return String(value);
}

function tooltipFormatter(format) {
    return (value, name) => [valueFormatter(value, format), name];
}

export function ChartRenderer({ chartModel, fallbackImageUrl, title, testId = "smarttap-chart" }) {
    if (!chartModel) {
        if (!fallbackImageUrl) {
            return null;
        }
        return (
            <img
                alt={title ?? "SmartTap chart"}
                style={{ width: "100%", borderRadius: 6, border: "1px solid #d9d9d9", background: "#ffffff", objectFit: "contain", marginTop: "0.75em" }}
                src={fallbackImageUrl}
            />
        );
    }

    const resolvedTitle = chartModel.title || title || "SmartTap chart";
    const legend = chartModel.series.length > 1;

    if (chartModel.kind === "pie" || chartModel.kind === "donut") {
        const valueKey = chartModel.series[0]?.key;
        if (!valueKey) {
            return null;
        }
        return (
            <div style={containerStyle} data-testid={testId}>
                <Title level={5} style={{ textAlign: "center", marginBottom: 12 }}>{resolvedTitle}</Title>
                <div style={{ height: 340, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip formatter={tooltipFormatter(chartModel.value_format)} />
                            {legend ? <Legend /> : null}
                            <Pie
                                data={chartModel.rows}
                                dataKey={valueKey}
                                nameKey={chartModel.x_key}
                                cx="50%"
                                cy="50%"
                                outerRadius="80%"
                                innerRadius={chartModel.kind === "donut" ? "42%" : 0}
                                label
                            >
                                {chartModel.rows.map((_, index) => (
                                    <Cell key={`${resolvedTitle}-${index}`} fill={fallbackPalette[index % fallbackPalette.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    const commonProps = {
        data: chartModel.rows,
        margin: { top: 16, right: 18, bottom: 14, left: 10 },
    };

    if (chartModel.kind === "line") {
        return (
            <div style={containerStyle} data-testid={testId}>
                <Title level={5} style={{ textAlign: "center", marginBottom: 12 }}>{resolvedTitle}</Title>
                <div style={{ height: 360, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart {...commonProps}>
                            <CartesianGrid stroke="#d6ddd8" strokeDasharray="3 3" />
                            <XAxis
                                dataKey={chartModel.x_key}
                                tick={{ fontSize: 12 }}
                                label={chartModel.x_label ? { value: chartModel.x_label, position: "insideBottom", offset: -8 } : undefined}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                label={
                                    chartModel.y_label
                                        ? { value: chartModel.y_label, angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }
                                        : undefined
                                }
                            />
                            <Tooltip formatter={tooltipFormatter(chartModel.value_format)} />
                            {legend ? <Legend /> : null}
                            {chartModel.series.map((series, index) => (
                                <Line
                                    key={series.key}
                                    type="monotone"
                                    dataKey={series.key}
                                    name={series.label}
                                    stroke={series.color ?? fallbackPalette[index % fallbackPalette.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle} data-testid={testId}>
            <Title level={5} style={{ textAlign: "center", marginBottom: 12 }}>{resolvedTitle}</Title>
            <div style={{ height: 360, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart {...commonProps} layout={chartModel.horizontal ? "vertical" : "horizontal"}>
                        <CartesianGrid stroke="#d6ddd8" strokeDasharray="3 3" />
                        {chartModel.horizontal ? (
                            <>
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 12 }}
                                    label={chartModel.y_label ? { value: chartModel.y_label, position: "insideBottom", offset: -8 } : undefined}
                                />
                                <YAxis
                                    dataKey={chartModel.x_key}
                                    type="category"
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                    label={
                                        chartModel.x_label
                                            ? { value: chartModel.x_label, angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }
                                            : undefined
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <XAxis
                                    dataKey={chartModel.x_key}
                                    tick={{ fontSize: 12 }}
                                    label={chartModel.x_label ? { value: chartModel.x_label, position: "insideBottom", offset: -8 } : undefined}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={
                                        chartModel.y_label
                                            ? { value: chartModel.y_label, angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }
                                            : undefined
                                    }
                                />
                            </>
                        )}
                        <Tooltip formatter={tooltipFormatter(chartModel.value_format)} />
                        {legend ? <Legend /> : null}
                        {chartModel.series.map((series, index) => (
                            <Bar
                                key={series.key}
                                dataKey={series.key}
                                name={series.label}
                                fill={series.color ?? fallbackPalette[index % fallbackPalette.length]}
                                stackId={chartModel.stacked ? "smarttap-stack" : undefined}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default ChartRenderer;
