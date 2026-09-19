import { useMemo } from "react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  FunnelChart,
  Funnel,
} from "recharts";

import { detectColumnTypes, suggestCharts } from "../Utils/DataUtils";
import TreeChart from "./TreeChart";

const CHART_COLORS = [
  "#6C63FF",
  "#4ECDC4",
  "#FF8B5C",
  "#45B7D1",
  "#20B486",
  "#F4A62A",
  "#E85D75",
  "#9B8AFB",
  "#7CC8C2",
  "#DDA0DD",
];

const GRID_COLOR = "#e5e8ef";
const AXIS_COLOR = "#8a93a5";
const TOOLTIP_BACKGROUND = "#ffffff";

const CHART_LABELS = {
  line: "Line",
  bar: "Bar",
  scatter: "Scatter",
  area: "Area",
  pie: "Pie",
  radar: "Radar",
  treemap: "Treemap",
  funnel: "Funnel",
  tree: "Tree",
};

const formatChartValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
};

const getNumericValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const getChartData = (data, xCol, yCol) => {
  return data
    .map((row) => ({
      ...row,
      __x: row?.[xCol],
      __y: getNumericValue(row?.[yCol]),
    }))
    .filter((row) => row.__x !== undefined && row.__y !== null);
};

const truncateLabel = (value, maxLength = 18) => {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
};

const ChartTooltip = () => (
  <Tooltip
    cursor={{ stroke: AXIS_COLOR, strokeDasharray: "4 4" }}
    contentStyle={{
      background: TOOLTIP_BACKGROUND,
      border: `1px solid ${GRID_COLOR}`,
      borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(20, 25, 40, 0.08)",
      fontSize: "12px",
    }}
    labelStyle={{
      color: "#172033",
      fontWeight: 700,
      marginBottom: 4,
    }}
    formatter={(value) => formatChartValue(value)}
  />
);

function ChartRenderer({
  data,
  xCol,
  yCol,
  chartType,
  treeLayout,
}) {
  const types = useMemo(
    () => (data?.length ? detectColumnTypes(data) : {}),
    [data]
  );

  const suggestions = useMemo(() => {
    if (!xCol || !yCol || !types[xCol] || !types[yCol]) {
      return [];
    }

    return suggestCharts(types[xCol], types[yCol]);
  }, [types, xCol, yCol]);

  const chartsToRender = useMemo(() => {
    if (Array.isArray(chartType) && chartType.length > 0) {
      return chartType;
    }

    return suggestions;
  }, [chartType, suggestions]);

  const chartData = useMemo(
    () => getChartData(data || [], xCol, yCol),
    [data, xCol, yCol]
  );

  const isNumericY = useMemo(
    () =>
      chartData.some((row) => row.__y !== null) &&
      chartData.length > 0,
    [chartData]
  );

  const chartHeight = {
    desktop: 360,
    mobile: 280,
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-chart-simple" />
        <strong>No data available</strong>
        <span>Upload a dataset to generate visualizations.</span>
      </div>
    );
  }

  if (!xCol || !yCol) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-table-columns" />
        <strong>Select your columns</strong>
        <span>Choose an X and Y column to generate a chart.</span>
      </div>
    );
  }

  if (!types[xCol] || !types[yCol]) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-triangle-exclamation" />
        <strong>Column information unavailable</strong>
        <span>
          The selected columns could not be analyzed for visualization.
        </span>
      </div>
    );
  }

  if (chartsToRender.length === 0) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-wand-magic-sparkles" />
        <strong>No chart suggestion available</strong>
        <span>Try selecting different columns.</span>
      </div>
    );
  }

  const renderCartesianChart = (chart) => (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      minHeight={chartHeight.desktop}
    >
      {chart}
    </ResponsiveContainer>
  );

  const renderChart = (type) => {
    switch (type) {
      case "line":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Line charts require numeric Y-axis values.
            </div>
          );
        }

        return renderCartesianChart(
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="__x"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tickFormatter={(value) => truncateLabel(value, 14)}
            />

            <YAxis
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={formatChartValue}
            />

            <ChartTooltip />

            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "8px",
              }}
            />

            <Line
              type="monotone"
              dataKey="__y"
              name={yCol}
              stroke={CHART_COLORS[0]}
              strokeWidth={3}
              dot={{
                r: 3,
                fill: CHART_COLORS[0],
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
              }}
              isAnimationActive
            />
          </LineChart>
        );

      case "bar":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Bar charts require numeric Y-axis values.
            </div>
          );
        }

        return renderCartesianChart(
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="__x"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tickFormatter={(value) => truncateLabel(value, 12)}
            />

            <YAxis
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={formatChartValue}
            />

            <ChartTooltip />

            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "8px",
              }}
            />

            <Bar
              dataKey="__y"
              name={yCol}
              radius={[6, 6, 0, 0]}
              maxBarSize={52}
              isAnimationActive
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`bar-${entry.__x}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        );

      case "scatter":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Scatter charts require numeric Y-axis values.
            </div>
          );
        }

        return renderCartesianChart(
          <ScatterChart
            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
            />

            <XAxis
              type="category"
              dataKey="__x"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tickFormatter={(value) => truncateLabel(value, 12)}
            />

            <YAxis
              type="number"
              dataKey="__y"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={formatChartValue}
            />

            <ChartTooltip />

            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "8px",
              }}
            />

            <Scatter
              name={yCol}
              data={chartData}
              fill={CHART_COLORS[2]}
              isAnimationActive
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`scatter-${entry.__x}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Scatter>
          </ScatterChart>
        );

      case "area":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Area charts require numeric Y-axis values.
            </div>
          );
        }

        return renderCartesianChart(
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
          >
            <defs>
              <linearGradient
                id="dataviz-area-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={CHART_COLORS[0]}
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_COLORS[0]}
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="__x"
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tickFormatter={(value) => truncateLabel(value, 14)}
            />

            <YAxis
              tick={{ fill: AXIS_COLOR, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={formatChartValue}
            />

            <ChartTooltip />

            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "8px",
              }}
            />

            <Area
              type="monotone"
              dataKey="__y"
              name={yCol}
              stroke={CHART_COLORS[0]}
              strokeWidth={2.5}
              fill="url(#dataviz-area-gradient)"
              activeDot={{ r: 5 }}
              isAnimationActive
            />
          </AreaChart>
        );

      case "pie":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Pie charts require numeric values.
            </div>
          );
        }

        return (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={chartHeight.desktop}
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="__y"
                nameKey="__x"
                cx="50%"
                cy="45%"
                innerRadius="32%"
                outerRadius="68%"
                paddingAngle={2}
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`pie-${entry.__x}-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>

              <ChartTooltip />

              <Legend
                verticalAlign="bottom"
                height={32}
                wrapperStyle={{
                  fontSize: "10px",
                }}
                formatter={(value) => truncateLabel(value, 18)}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "radar":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Radar charts require numeric values.
            </div>
          );
        }

        return (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={chartHeight.desktop}
          >
            <RadarChart
              data={chartData}
              outerRadius="68%"
            >
              <PolarGrid stroke={GRID_COLOR} />

              <PolarAngleAxis
                dataKey="__x"
                tick={{
                  fill: AXIS_COLOR,
                  fontSize: 10,
                }}
                tickFormatter={(value) => truncateLabel(value, 12)}
              />

              <PolarRadiusAxis
                tick={{
                  fill: AXIS_COLOR,
                  fontSize: 9,
                }}
              />

              <Radar
                name={yCol}
                dataKey="__y"
                stroke={CHART_COLORS[2]}
                fill={CHART_COLORS[2]}
                fillOpacity={0.28}
                strokeWidth={2}
                isAnimationActive
              />

              <ChartTooltip />

              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "treemap":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Treemaps require numeric values.
            </div>
          );
        }

        return (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={chartHeight.desktop}
          >
            <Treemap
              data={chartData}
              dataKey="__y"
              nameKey="__x"
              aspectRatio={4 / 3}
              stroke="var(--surface)"
              content={({
                x,
                y,
                width,
                height,
                name,
                value,
                index,
              }) => {
                if (width <= 10 || height <= 10) {
                  return null;
                }

                const showText = width > 65 && height > 35;

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={8}
                      ry={8}
                      fill={
                        CHART_COLORS[index % CHART_COLORS.length]
                      }
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />

                    {showText && (
                      <>
                        <text
                          x={x + width / 2}
                          y={y + height / 2 - 5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#fff"
                          fontSize={10}
                          fontWeight={700}
                        >
                          {truncateLabel(name, 16)}
                        </text>

                        <text
                          x={x + width / 2}
                          y={y + height / 2 + 10}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.8)"
                          fontSize={8}
                        >
                          {formatChartValue(value)}
                        </text>
                      </>
                    )}
                  </g>
                );
              }}
            />

            <ChartTooltip />
          </ResponsiveContainer>
        );

      case "funnel":
        if (!isNumericY) {
          return (
            <div className="chart-message">
              Funnel charts require numeric stage values.
            </div>
          );
        }

        return (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={chartHeight.desktop}
          >
            <FunnelChart>
              <Funnel
                data={chartData}
                dataKey="__y"
                nameKey="__x"
                isAnimationActive
                fill={CHART_COLORS[0]}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`funnel-${entry.__x}-${index}`}
                    fill={
                      CHART_COLORS[index % CHART_COLORS.length]
                    }
                  />
                ))}
              </Funnel>

              <ChartTooltip />
            </FunnelChart>
          </ResponsiveContainer>
        );

      case "tree":
        return (
          <div className="tree-chart-container">
            <TreeChart
              data={data}
              layout={treeLayout || "vertical"}
            />
          </div>
        );

      default:
        return (
          <div className="chart-message">
            Unknown chart type: {type}
          </div>
        );
    }
  };

  return (
    <div className="charts">
      {chartsToRender.map((type, index) => (
        <article
          key={`${type}-${index}`}
          className={`chart-wrapper chart-${type}`}
        >
          <div className="chart-wrapper-header">
            <div>
              <span className="chart-wrapper-eyebrow">
                Visualization
              </span>

              <h2>
                {CHART_LABELS[type] || type} Chart
              </h2>
            </div>

            <span className="chart-wrapper-type">
              {type}
            </span>
          </div>

          <div className="chart-render-area">
            {renderChart(type)}
          </div>
        </article>
      ))}
    </div>
  );
}

export default ChartRenderer;