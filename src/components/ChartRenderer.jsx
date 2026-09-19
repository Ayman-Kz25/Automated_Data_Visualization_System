import ReactECharts from "echarts-for-react";

import { detectColumnTypes, suggestCharts } from "../Utils/DataUtils";
import TreeChart from "./TreeChart";

/* =========================================================
   CHART PALETTE
   ========================================================= */

const COLORS = [
  "#6C63FF",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#F7C948",
  "#DDA0DD",
  "#FF9F43",
  "#5DADE2",
  "#58D68D",
  "#AF7AC5",
  "#F1948A",
];

/* =========================================================
   HELPERS
   ========================================================= */

const isDarkMode = () =>
  document.body.classList.contains("dark") ||
  document.documentElement.classList.contains("dark");

const getThemeColors = () => {
  const dark = isDarkMode();

  return {
    text: dark ? "#F2F4F8" : "#172033",
    secondaryText: dark ? "#AEB6C6" : "#5F687A",
    mutedText: dark ? "#818A9C" : "#8A93A5",
    border: dark ? "#2B3240" : "#E5E8EF",
    grid: dark ? "#2B3240" : "#E9ECF2",
    background: dark ? "#191E29" : "#FFFFFF",
    tooltipBackground: dark ? "#202633" : "#FFFFFF",
  };
};

/* =========================================================
   VALUE CONVERSION
   ========================================================= */

const toNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/[$€£¥%]/g, "")
    .trim();

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
};

/* =========================================================
   FORMATTERS
   ========================================================= */

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
};

/* =========================================================
   CHART OPTION FACTORY
   ========================================================= */

function buildChartOption({ type, data, xCol, yCol, colors }) {
  const theme = getThemeColors();

  const categories = data.map((item) => item[xCol]);
  const values = data.map((item) => toNumber(item[yCol]));

  /* =======================================================
     COMMON
     ======================================================= */

  const common = {
    animation: true,
    animationDuration: 650,
    animationEasing: "cubicOut",

    backgroundColor: "transparent",

    textStyle: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: theme.text,
    },

    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: theme.tooltipBackground,
      borderColor: theme.border,
      borderWidth: 1,

      textStyle: {
        color: theme.text,
        fontSize: 12,
      },

      extraCssText:
        "box-shadow: 0 10px 30px rgba(0,0,0,0.12); border-radius: 10px;",
    },

    grid: {
      top: 45,
      right: 25,
      bottom: 65,
      left: 65,
      containLabel: true,
    },

    legend: {
      show: false,

      textStyle: {
        color: theme.secondaryText,
      },
    },
  };

  /* =======================================================
     LINE
     ======================================================= */

  if (type === "line") {
    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "axis",
      },

      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
        },
        {
          type: "slider",
          height: 18,
          bottom: 10,
          borderColor: "transparent",
          backgroundColor: theme.border,
          fillerColor: "rgba(108, 99, 255, 0.2)",

          handleStyle: {
            color: colors[0],
          },
        },
      ],

      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,

        axisLine: {
          lineStyle: {
            color: theme.border,
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      yAxis: {
        type: "value",

        splitLine: {
          lineStyle: {
            color: theme.grid,
            type: "dashed",
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      series: [
        {
          name: yCol,
          type: "line",
          data: values,
          smooth: true,
          symbol: "circle",
          symbolSize: 7,

          lineStyle: {
            width: 3,
            color: colors[0],
          },

          itemStyle: {
            color: colors[0],
            borderColor: theme.background,
            borderWidth: 2,
          },

          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,

              colorStops: [
                {
                  offset: 0,
                  color: "rgba(108,99,255,0.25)",
                },
                {
                  offset: 1,
                  color: "rgba(108,99,255,0.01)",
                },
              ],
            },
          },

          emphasis: {
            focus: "series",
          },
        },
      ],
    };
  }

  /* =======================================================
     BAR
     ======================================================= */

  if (type === "bar") {
    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "axis",
      },

      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
        },
        {
          type: "slider",
          height: 18,
          bottom: 10,
          borderColor: "transparent",
          backgroundColor: theme.border,
          fillerColor: "rgba(108, 99, 255, 0.2)",

          handleStyle: {
            color: colors[0],
          },
        },
      ],

      xAxis: {
        type: "category",
        data: categories,

        axisLine: {
          lineStyle: {
            color: theme.border,
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
          rotate: categories.length > 12 ? 35 : 0,
        },
      },

      yAxis: {
        type: "value",

        splitLine: {
          lineStyle: {
            color: theme.grid,
            type: "dashed",
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      series: [
        {
          name: yCol,
          type: "bar",
          data: values,
          barMaxWidth: 42,

          itemStyle: {
            color: (params) =>
              colors[params.dataIndex % colors.length],

            borderRadius: [7, 7, 0, 0],
          },

          emphasis: {
            focus: "series",

            itemStyle: {
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.15)",
            },
          },
        },
      ],
    };
  }

  /* =======================================================
     SCATTER
     ======================================================= */

  if (type === "scatter") {
    const scatterData = data
      .map((item) => [
        toNumber(item[xCol]),
        toNumber(item[yCol]),
      ])
      .filter(
        (item) => item[0] !== null && item[1] !== null
      );

    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "item",

        formatter: (params) => {
          const value = params.value || [];

          return `
            <div>
              <strong>${xCol}</strong>: ${formatValue(value[0])}<br/>
              <strong>${yCol}</strong>: ${formatValue(value[1])}
            </div>
          `;
        },
      },

      xAxis: {
        type: "value",
        name: xCol,

        nameTextStyle: {
          color: theme.secondaryText,
        },

        splitLine: {
          lineStyle: {
            color: theme.grid,
            type: "dashed",
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      yAxis: {
        type: "value",
        name: yCol,

        nameTextStyle: {
          color: theme.secondaryText,
        },

        splitLine: {
          lineStyle: {
            color: theme.grid,
            type: "dashed",
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      series: [
        {
          name: `${xCol} vs ${yCol}`,
          type: "scatter",
          data: scatterData,
          symbolSize: 11,

          itemStyle: {
            color: colors[0],
            opacity: 0.75,
          },

          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 12,
              shadowColor: "rgba(0,0,0,0.2)",
            },
          },
        },
      ],
    };
  }

  /* =======================================================
     AREA
     ======================================================= */

  if (type === "area") {
    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "axis",
      },

      dataZoom: [
        {
          type: "inside",
        },
        {
          type: "slider",
          height: 18,
          bottom: 10,
          borderColor: "transparent",
          backgroundColor: theme.border,
          fillerColor: "rgba(221,160,221,0.25)",
        },
      ],

      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,

        axisLine: {
          lineStyle: {
            color: theme.border,
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      yAxis: {
        type: "value",

        splitLine: {
          lineStyle: {
            color: theme.grid,
            type: "dashed",
          },
        },

        axisLabel: {
          color: theme.mutedText,
          fontSize: 10,
        },
      },

      series: [
        {
          name: yCol,
          type: "line",
          data: values,
          smooth: true,
          symbol: "none",

          lineStyle: {
            width: 2,
            color: colors[5],
          },

          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,

              colorStops: [
                {
                  offset: 0,
                  color: "rgba(221,160,221,0.55)",
                },
                {
                  offset: 1,
                  color: "rgba(221,160,221,0.04)",
                },
              ],
            },
          },
        },
      ],
    };
  }

  /* =======================================================
     PIE / DONUT
     ======================================================= */

  if (type === "pie") {
    const pieData = data
      .map((item, index) => ({
        name: item[xCol],
        value: toNumber(item[yCol]),

        itemStyle: {
          color: colors[index % colors.length],
        },
      }))
      .filter((item) => item.value !== null);

    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "item",
        formatter: "{b}<br/>{c} ({d}%)",
      },

      legend: {
        show: true,
        type: "scroll",
        bottom: 0,
        left: "center",

        textStyle: {
          color: theme.secondaryText,
          fontSize: 10,
        },
      },

      series: [
        {
          name: yCol,
          type: "pie",
          radius: ["42%", "72%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: true,

          itemStyle: {
            borderColor: theme.background,
            borderWidth: 3,
            borderRadius: 7,
          },

          label: {
            color: theme.text,
            fontSize: 10,
            formatter: "{b}\n{d}%",
          },

          labelLine: {
            lineStyle: {
              color: theme.mutedText,
            },
          },

          emphasis: {
            scale: true,
            scaleSize: 8,

            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0,0,0,0.18)",
            },
          },

          data: pieData,
        },
      ],
    };
  }

  /* =======================================================
     RADAR
     ======================================================= */

  if (type === "radar") {
    const numericValues = values.map((value) =>
      value === null ? 0 : value
    );

    const maxValue = Math.max(...numericValues, 1);

    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "item",
      },

      radar: {
        radius: "65%",

        indicator: data.map((item) => ({
          name: String(item[xCol]),
          max: maxValue,
        })),

        axisName: {
          color: theme.secondaryText,
          fontSize: 10,
        },

        splitLine: {
          lineStyle: {
            color: theme.grid,
          },
        },

        splitArea: {
          areaStyle: {
            color: [
              "rgba(108,99,255,0.02)",
              "rgba(108,99,255,0.05)",
            ],
          },
        },

        axisLine: {
          lineStyle: {
            color: theme.border,
          },
        },
      },

      series: [
        {
          type: "radar",

          data: [
            {
              name: yCol,
              value: numericValues,

              lineStyle: {
                color: colors[1],
                width: 2,
              },

              itemStyle: {
                color: colors[1],
              },

              areaStyle: {
                color: "rgba(255,107,107,0.25)",
              },

              symbol: "circle",
              symbolSize: 6,
            },
          ],
        },
      ],
    };
  }

  /* =======================================================
     TREEMAP
     ======================================================= */

  if (type === "treemap") {
    const treeData = data
      .map((item, index) => ({
        name: String(item[xCol]),
        value: toNumber(item[yCol]) || 0,

        itemStyle: {
          color: colors[index % colors.length],
        },
      }))
      .filter((item) => item.value > 0);

    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "item",

        formatter: (params) => `
          <strong>${params.name}</strong><br/>
          ${yCol}: ${formatValue(params.value)}
        `,
      },

      series: [
        {
          type: "treemap",
          data: treeData,
          roam: true,
          nodeClick: "zoomToNode",

          breadcrumb: {
            show: true,
            bottom: 5,
            height: 22,

            itemStyle: {
              color: theme.background,
              borderColor: theme.border,

              textStyle: {
                color: theme.secondaryText,
              },
            },
          },

          label: {
            show: true,
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
          },

          upperLabel: {
            show: false,
          },

          itemStyle: {
            borderColor: theme.background,
            borderWidth: 3,
            gapWidth: 3,
            borderRadius: 5,
          },

          levels: [
            {
              itemStyle: {
                borderColor: theme.background,
                borderWidth: 4,
                gapWidth: 4,
              },
            },
          ],
        },
      ],
    };
  }

  /* =======================================================
     FUNNEL
     ======================================================= */

  if (type === "funnel") {
    const funnelData = data
      .map((item, index) => ({
        name: String(item[xCol]),
        value: toNumber(item[yCol]) || 0,

        itemStyle: {
          color: colors[index % colors.length],
        },
      }))
      .filter((item) => item.value > 0);

    return {
      ...common,

      tooltip: {
        ...common.tooltip,
        trigger: "item",

        formatter: (params) => `
          <strong>${params.name}</strong><br/>
          ${yCol}: ${formatValue(params.value)}
        `,
      },

      series: [
        {
          name: yCol,
          type: "funnel",

          left: "10%",
          top: 20,
          bottom: 30,
          width: "80%",
          min: 0,

          sort: "descending",
          gap: 5,

          label: {
            show: true,
            position: "inside",
            color: "#fff",
            fontSize: 11,
            fontWeight: 650,
          },

          labelLine: {
            show: false,
          },

          itemStyle: {
            borderColor: theme.background,
            borderWidth: 2,
            borderRadius: 4,
          },

          emphasis: {
            label: {
              fontSize: 13,
            },

            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0,0,0,0.18)",
            },
          },

          data: funnelData,
        },
      ],
    };
  }

  return {};
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function ChartRenderer({
  data,
  xCol,
  yCol,
  chartType,
  treeLayout,
}) {
  /* =======================================================
     VALIDATION
     ======================================================= */

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-chart-simple"></i>
        <p>No data to render</p>
      </div>
    );
  }

  if (!xCol || !yCol) {
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-columns"></i>
        <p>Please select X and Y columns</p>
      </div>
    );
  }

  const types = detectColumnTypes(data);

  if (!types[xCol] || !types[yCol]) {
    return null;
  }

  /* =======================================================
     AUTOMATIC CHART SUGGESTIONS
     ======================================================= */

  const suggestions = suggestCharts(
    types[xCol],
    types[yCol]
  );

  const chartsToRender =
    Array.isArray(chartType) && chartType.length > 0
      ? chartType
      : suggestions;

  /* =======================================================
     THEME
     ======================================================= */

  const themeKey = isDarkMode() ? "dark" : "light";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="charts">
      {chartsToRender.map((type, index) => {
        /* ===================================================
           TREE CHART
           =================================================== */

        if (type === "tree") {
          return (
            <div
              key={`tree-${index}`}
              className="chart-wrapper"
            >
              <div className="chart-wrapper-header">
                <div>
                  <h2>Tree Chart</h2>

                  <p>
                    Hierarchical relationship visualization
                  </p>
                </div>

                <span className="chart-type-badge">
                  Tree
                </span>
              </div>

              <div
                className="chart-canvas tree-chart-canvas"
                style={{
                  width: "100%",
                  height: 500,
                }}
              >
                <TreeChart
                  data={data}
                  layout={treeLayout || "vertical"}
                />
              </div>
            </div>
          );
        }

        /* ===================================================
           ECHARTS
           =================================================== */

        const option = buildChartOption({
          type,
          data,
          xCol,
          yCol,
          colors: COLORS,
        });

        return (
          <div
            key={`${type}-${index}`}
            className="chart-wrapper"
          >
            <div className="chart-wrapper-header">
              <div>
                <h2>
                  {type.charAt(0).toUpperCase() +
                    type.slice(1)}{" "}
                  Chart
                </h2>

                <p>
                  {xCol} vs {yCol}
                </p>
              </div>

              <span className="chart-type-badge">
                {type}
              </span>
            </div>

            <div className="chart-canvas">
              <ReactECharts
                option={option}
                notMerge={true}
                lazyUpdate={true}
                theme={themeKey}
                opts={{
                  renderer: "canvas",
                  devicePixelRatio:
                    window.devicePixelRatio || 1,
                }}
                style={{
                  width: "100%",
                  height: "350px",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChartRenderer;
