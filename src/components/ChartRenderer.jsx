import React from "react";
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
  LabelList,
  Layer,
} from "recharts";
import { detectColumnTypes, suggestCharts } from "../Utils/DataUtils";
import TreeChart from "./TreeChart";
import "../App.css";

const BAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#F8C471",
];
const SCATTER_COLORS = ["#FF7F50", "#1E90FF", "#FFD700", "#32CD32"];
const PIE_COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];
const AREA_COLOR = "#DDA0DD";
const RADAR_COLOR = "#FF7F50";
const TREEMAP_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];
const FUNNEL_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

function ChartRenderer({ data, xCol, yCol, chartType, customChart, treeLayout }) {
  if (!data || data.length === 0) return <p>No data to render</p>;
  if (!xCol || !yCol) return <p>Please select columns</p>;

  const types = detectColumnTypes(data);
  if (!types[xCol] || !types[yCol]) return null;

  const suggestions = suggestCharts(types[xCol], types[yCol]);
  const chartsToRender =
    Array.isArray(chartType) && chartType.length > 0 ? chartType : suggestions; // multi-select or auto suggestions

  const renderChart = (type) => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xCol} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yCol} stroke="#4ECDC4" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xCol} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yCol}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey={xCol} />
              <YAxis type={typeof data[0][yCol] === "number" ? "number" : "category"} dataKey={yCol} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter data={data} dataKey={yCol} shape="diamond">
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={SCATTER_COLORS[idx % SCATTER_COLORS.length]}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xCol} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={yCol}
                stroke={AREA_COLOR}
                fill={AREA_COLOR}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip />
              {/* <Legend verticalAlign="bottom" /> */}
              <Pie
                data={data}
                dataKey={yCol}
                nameKey={xCol}
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={50}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} outerRadius={120}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xCol} />
              <PolarRadiusAxis />
              <Radar
                name={yCol}
                dataKey={yCol}
                stroke={RADAR_COLOR}
                fill={RADAR_COLOR}
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case "treemap":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={data}
              dataKey={yCol}
              nameKey={xCol}
              stroke="#fff"
              fill="#8884d8"
              content={({ x, y, width, height, name, value, index }) => (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
                      stroke: "#fff",
                      rx: 8, //Round corners
                      ry: 8,
                    }}
                  />
                  <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={10}
                    fontWeight="normal"
                  >
                    {name}
                  </text>
                </g>
              )}
            />
          </ResponsiveContainer>
        );
      case "funnel":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                data={data}
                dataKey={yCol}
                nameKey={xCol}
                isAnimationActive
                shape="trapezoid"
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} // gradient for all stages
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
                {/* <LabelList position="right" fill="#333" /> */}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      case "tree":
        return (
          <div style={{ width: "100%", height: 500 }}>
            <TreeChart data={data} layout={treeLayout || "vertical"} />
          </div>
        );

      default:
        return <p>Unknown chart type</p>;
    }
  };

  return (
    <div className="charts">
      {chartsToRender.map((type, idx) => (
        <div key={idx} className="chart-wrapper">
          <h2>{type.charAt(0).toUpperCase() + type.slice(1)} Chart</h2>
          {renderChart(type)}
        </div>
      ))}
    </div>
  );
}

export default ChartRenderer;
