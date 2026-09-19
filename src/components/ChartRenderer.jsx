import ReactECharts from "echarts-for-react";

import {
  detectColumnTypes,
  suggestCharts,
} from "../Utils/DataUtils";

/* LOGO CHART PALETTE */

/* CHART PALETTE */
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

/* HELPERS */

const isDarkMode = () =>
  document.body.classList.contains("dark") ||
  document.documentElement.classList.contains("dark");

const getThemeColors = () => {
  const dark = isDarkMode();

  return {
    text: dark ? "#F3F7F9" : "#202B34",
    secondaryText: dark ? "#C1CDD4" : "#586873",
    mutedText: dark ? "#8798A3" : "#8997A1",
    border: dark ? "#30404A" : "#E1E8ED",
    grid: dark ? "#30404A" : "#E7EDF1",
    background: dark ? "#1D2931" : "#FFFFFF",
    tooltipBackground: dark ? "#202D35" : "#FFFFFF",
  };
};

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/* COMMON TOOLBOX */

const getToolbox = () => {
  const theme = getThemeColors();

  return {
    show: true,
    orient: "horizontal",
    right: 12,
    top: 0,

    itemSize: 16,
    itemGap: 10,

    feature: {
      dataZoom: {
        title: {
          zoom: "Zoom",
          back: "Reset Zoom",
        },
      },

      restore: {
        title: "Restore",
      },

      saveAsImage: {
        title: "Save Chart",
        pixelRatio: 2,
      },
    },

    iconStyle: {
      borderColor: theme.mutedText,
      borderWidth: 1.5,
    },

    emphasis: {
      iconStyle: {
        borderColor: COLORS[0],
      },
    },
  };
};

/* DATA ZOOM */

const getDataZoom = (theme, showSlider = true) => {
  const controls = [
    {
      type: "inside",
      start: 0,
      end: 100,
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: true,
    },
  ];

  if (showSlider) {
    controls.push({
      type: "slider",
      height: 18,
      bottom: 10,
      left: 65,
      right: 25,
      borderColor: "transparent",
      backgroundColor: theme.border,
      fillerColor: "rgba(52,109,146,0.18)",

      handleStyle: {
        color: COLORS[0],
        borderColor: COLORS[0],
      },

      textStyle: {
        color: theme.mutedText,
      },
    });
  }

  return controls;
};

/* COMMON OPTION */

const getCommonOption = (theme) => ({
  animation: true,
  animationDuration: 600,
  animationEasing: "cubicOut",

  backgroundColor: "transparent",

  color: COLORS,

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

    padding: [10, 12],

    textStyle: {
      color: theme.text,
      fontSize: 12,
    },

    extraCssText:
      "box-shadow: 0 10px 30px rgba(0,0,0,0.12); border-radius: 10px;",

    axisPointer: {
      type: "cross",

      lineStyle: {
        color: COLORS[0],
        type: "dashed",
        width: 1,
      },

      label: {
        backgroundColor: COLORS[0],
      },
    },
  },

  toolbox: getToolbox(),

  grid: {
    top: 48,
    right: 25,
    bottom: 70,
    left: 65,
    containLabel: true,
  },

  legend: {
    show: false,

    textStyle: {
      color: theme.secondaryText,
    },
  },
});

/* CATEGORY AXES */

const buildCategoryXAxis = ({
  categories,
  theme,
  rotate = 0,
}) => ({
  type: "category",
  data: categories,

  axisLine: {
    lineStyle: {
      color: theme.border,
    },
  },

  axisTick: {
    show: false,
  },

  axisLabel: {
    color: theme.mutedText,
    fontSize: 10,
    rotate,
    hideOverlap: true,
  },
});

const buildValueYAxis = (theme) => ({
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
});

/* LINE CHART */

function buildLineOption({
  xCol,
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      formatter: (params) => {
        if (!Array.isArray(params) || params.length === 0) {
          return "";
        }

        const point = params[0];

        return `
          <div style="min-width:150px">
            <strong>${escapeHtml(xCol)}</strong>: ${escapeHtml(
          formatValue(point.axisValue)
        )}
            <br/>
            <strong>${escapeHtml(yCol)}</strong>: ${escapeHtml(
          formatValue(point.value)
        )}
          </div>
        `;
      },
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
    }),

    yAxis: buildValueYAxis(theme),

    series: [
      {
        name: yCol,
        type: "line",
        data: values,

        smooth: 0.35,

        symbol: "circle",
        symbolSize: 7,

        showSymbol: categories.length < 80,

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
                color: "rgba(52,109,146,0.22)",
              },
              {
                offset: 1,
                color: "rgba(52,109,146,0.015)",
              },
            ],
          },
        },

        emphasis: {
          focus: "series",

          itemStyle: {
            shadowBlur: 14,
            shadowColor: "rgba(52,109,146,0.3)",
          },
        },

        select: {
          itemStyle: {
            color: COLORS[2],
            borderColor: theme.background,
            borderWidth: 3,
          },
        },
      },
    ],
  };
}

/* STEP LINE */

function buildStepLineOption({
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,
      trigger: "axis",
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
    }),

    yAxis: buildValueYAxis(theme),

    series: [
      {
        name: yCol,
        type: "line",
        data: values,

        step: "end",

        symbol: "circle",
        symbolSize: 6,

        lineStyle: {
          width: 3,
          color: colors[2],
        },

        itemStyle: {
          color: colors[2],
          borderColor: theme.background,
          borderWidth: 2,
        },

        emphasis: {
          focus: "series",
        },
      },
    ],
  };
}

/* BAR CHART */

function buildBarOption({
  xCol,
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      formatter: (params) => {
        const point = Array.isArray(params) ? params[0] : params;

        if (!point) {
          return "";
        }

        return `
          <div>
            <strong>${escapeHtml(xCol)}</strong>: ${escapeHtml(
          formatValue(point.axisValue)
        )}
            <br/>
            <strong>${escapeHtml(yCol)}</strong>: ${escapeHtml(
          formatValue(point.value)
        )}
          </div>
        `;
      },
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
      rotate: categories.length > 12 ? 35 : 0,
    }),

    yAxis: buildValueYAxis(theme),

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
            shadowBlur: 16,
            shadowColor: "rgba(52,109,146,0.25)",
          },
        },

        select: {
          itemStyle: {
            borderColor: theme.text,
            borderWidth: 2,
          },
        },

        selectedMode: "single",
      },
    ],
  };
}

/* HORIZONTAL BAR */

function buildHorizontalBarOption({
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },

    dataZoom: getDataZoom(theme, true),

    grid: {
      top: 48,
      right: 30,
      bottom: 70,
      left: 90,
      containLabel: true,
    },

    xAxis: buildValueYAxis(theme),

    yAxis: {
      type: "category",
      data: categories,

      axisLine: {
        lineStyle: {
          color: theme.border,
        },
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        color: theme.mutedText,
        fontSize: 10,
        hideOverlap: true,
      },
    },

    series: [
      {
        name: yCol,
        type: "bar",
        data: values,

        barMaxWidth: 30,

        itemStyle: {
          color: (params) =>
            colors[params.dataIndex % colors.length],

          borderRadius: [0, 7, 7, 0],
        },

        emphasis: {
          focus: "series",

          itemStyle: {
            shadowBlur: 14,
            shadowColor: "rgba(52,109,146,0.25)",
          },
        },

        selectedMode: "single",
      },
    ],
  };
}

/* STACKED BAR */

function buildStackedBarOption({
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  const positiveValues = values.map((value) =>
    value === null ? 0 : value
  );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
      rotate: categories.length > 12 ? 35 : 0,
    }),

    yAxis: buildValueYAxis(theme),

    series: [
      {
        name: yCol,
        type: "bar",
        stack: "total",
        data: positiveValues,

        itemStyle: {
          color: colors[0],
          borderRadius: [6, 6, 0, 0],
        },

        emphasis: {
          focus: "series",
        },
      },
    ],
  };
}

/* PERCENT STACKED BAR */

function buildPercentStackedBarOption({
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  const total = values.reduce(
    (sum, value) => sum + (value ?? 0),
    0
  );

  const percentages = values.map((value) =>
    total > 0 && value !== null
      ? Number(((value / total) * 100).toFixed(2))
      : 0
  );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
      rotate: categories.length > 12 ? 35 : 0,
    }),

    yAxis: {
      type: "value",
      max: 100,

      axisLabel: {
        color: theme.mutedText,
        fontSize: 10,
        formatter: "{value}%",
      },

      splitLine: {
        lineStyle: {
          color: theme.grid,
          type: "dashed",
        },
      },
    },

    series: [
      {
        name: yCol,
        type: "bar",
        data: percentages,

        itemStyle: {
          color: colors[1],
          borderRadius: [7, 7, 0, 0],
        },

        label: {
          show: categories.length <= 12,
          position: "top",
          color: theme.secondaryText,
          formatter: "{c}%",
        },

        emphasis: {
          focus: "series",
        },
      },
    ],
  };
}

/* AREA CHART */

function buildAreaOption({
  yCol,
  categories,
  values,
  colors,
  theme,
}) {
  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,
      trigger: "axis",
    },

    dataZoom: getDataZoom(theme, true),

    xAxis: buildCategoryXAxis({
      categories,
      theme,
    }),

    yAxis: buildValueYAxis(theme),

    series: [
      {
        name: yCol,
        type: "line",
        data: values,

        smooth: 0.35,
        symbol: "none",

        lineStyle: {
          width: 3,
          color: colors[1],
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
                color: "rgba(240,135,200,0.38)",
              },
              {
                offset: 1,
                color: "rgba(240,135,200,0.03)",
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

/* SCATTER CHART */

function buildScatterOption({
  data,
  xCol,
  yCol,
  colors,
  theme,
}) {
  const scatterData = data
    .map((item) => [
      toNumber(item[xCol]),
      toNumber(item[yCol]),
    ])
    .filter(
      (item) => item[0] !== null && item[1] !== null
    );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      trigger: "item",

      formatter: (params) => {
        const value = params.value || [];

        return `
          <div>
            <strong>${escapeHtml(xCol)}</strong>: ${escapeHtml(
          formatValue(value[0])
        )}
            <br/>
            <strong>${escapeHtml(yCol)}</strong>: ${escapeHtml(
          formatValue(value[1])
        )}
          </div>
        `;
      },
    },

    brush: {
      toolbox: ["rect", "polygon", "clear"],
      brushMode: "single",

      brushStyle: {
        color: "rgba(240,135,200,0.15)",
        borderColor: COLORS[1],
      },
    },

    xAxis: {
      type: "value",
      name: xCol,

      nameTextStyle: {
        color: theme.secondaryText,
        fontWeight: 600,
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
        fontWeight: 600,
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

        symbolSize: 12,

        itemStyle: {
          color: colors[3],
          opacity: 0.72,
        },

        emphasis: {
          focus: "series",

          itemStyle: {
            color: colors[1],
            opacity: 1,
            shadowBlur: 15,
            shadowColor: "rgba(240,135,200,0.35)",
          },
        },

        select: {
          itemStyle: {
            color: colors[2],
            borderColor: theme.background,
            borderWidth: 2,
          },
        },

        selectedMode: "multiple",
      },
    ],
  };
}

/* PIE CHART */

function buildPieOption({
  data,
  xCol,
  yCol,
  colors,
  theme,
  donut = false,
}) {
  const pieData = data
    .map((item, index) => ({
      name: String(item[xCol]),
      value: toNumber(item[yCol]),

      itemStyle: {
        color: colors[index % colors.length],
      },
    }))
    .filter((item) => item.value !== null);

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      trigger: "item",

      formatter: (params) => `
        <div>
          <strong>${escapeHtml(params.name)}</strong>
          <br/>
          ${escapeHtml(yCol)}: ${escapeHtml(
        formatValue(params.value)
      )}
          <br/>
          Share: ${escapeHtml(params.percent)}%
        </div>
      `,
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

      pageIconColor: COLORS[0],
      pageTextStyle: {
        color: theme.mutedText,
      },
    },

    series: [
      {
        name: yCol,
        type: "pie",

        radius: donut
          ? ["45%", "72%"]
          : "68%",

        center: ["50%", "45%"],

        selectedMode: "single",
        selectedOffset: 12,

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
            shadowBlur: 18,
            shadowColor: "rgba(0,0,0,0.2)",
          },
        },

        data: pieData,
      },
    ],
  };
}

/* HISTOGRAM */

function buildHistogramOption({
  data,
  yCol,
  colors,
  theme,
}) {
  const numericValues = data
    .map((item) => toNumber(item[yCol]))
    .filter((value) => value !== null);

  if (numericValues.length === 0) {
    return {};
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  const binCount = Math.max(
    5,
    Math.min(20, Math.ceil(Math.sqrt(numericValues.length)))
  );

  const range = max - min || 1;
  const binWidth = range / binCount;

  const bins = Array.from(
    { length: binCount },
    (_, index) => ({
      start: min + index * binWidth,
      end:
        index === binCount - 1
          ? max
          : min + (index + 1) * binWidth,
      count: 0,
    })
  );

  numericValues.forEach((value) => {
    let index = Math.floor((value - min) / binWidth);

    if (index >= binCount) {
      index = binCount - 1;
    }

    bins[index].count += 1;
  });

  const labels = bins.map(
    (bin) =>
      `${formatValue(bin.start)} - ${formatValue(bin.end)}`
  );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      trigger: "axis",

      axisPointer: {
        type: "shadow",
      },
    },

    xAxis: {
      type: "category",
      data: labels,

      axisLine: {
        lineStyle: {
          color: theme.border,
        },
      },

      axisTick: {
        show: false,
      },

      axisLabel: {
        color: theme.mutedText,
        fontSize: 9,
        rotate: labels.length > 8 ? 35 : 0,
      },
    },

    yAxis: {
      type: "value",
      name: "Frequency",

      splitLine: {
        lineStyle: {
          color: theme.grid,
        },
      },

      axisLabel: {
        color: theme.mutedText,
        fontSize: 10,
      },
    },

    series: [
      {
        name: "Frequency",
        type: "bar",

        data: bins.map((bin) => bin.count),

        barCategoryGap: "0%",

        itemStyle: {
          color: colors[4],
          borderColor: theme.background,
          borderWidth: 1,
        },

        emphasis: {
          itemStyle: {
            color: colors[3],
          },
        },
      },
    ],
  };
}

/* BOX PLOT */

function buildBoxPlotOption({
  data,
  xCol,
  yCol,
  colors,
  theme,
}) {
  const values = data
    .map((item) => toNumber(item[yCol]))
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (values.length < 2) {
    return {};
  }

  const percentile = (array, p) => {
    const index = (array.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return array[lower];
    }

    return (
      array[lower] +
      (array[upper] - array[lower]) * (index - lower)
    );
  };

  const q1 = percentile(values, 0.25);
  const median = percentile(values, 0.5);
  const q3 = percentile(values, 0.75);

  const iqr = q3 - q1;

  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const lowerWhisker =
    values.find((value) => value >= lowerFence) ??
    values[0];

  const upperWhisker =
    [...values]
      .reverse()
      .find((value) => value <= upperFence) ??
    values[values.length - 1];

  const outliers = values.filter(
    (value) =>
      value < lowerFence || value > upperFence
  );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      trigger: "item",

      formatter: (params) => {
        if (params.seriesType === "boxplot") {
          const value = params.value || [];

          return `
            <strong>${escapeHtml(yCol)}</strong>
            <br/>
            Min: ${formatValue(value[1])}
            <br/>
            Q1: ${formatValue(value[2])}
            <br/>
            Median: ${formatValue(value[3])}
            <br/>
            Q3: ${formatValue(value[4])}
            <br/>
            Max: ${formatValue(value[5])}
          `;
        }

        return `
          <strong>${escapeHtml(yCol)}</strong>
          <br/>
          Outlier: ${formatValue(params.value?.[1] ?? params.value)}
        `;
      },
    },

    xAxis: {
      type: "category",
      data: [xCol || yCol],

      axisLabel: {
        color: theme.secondaryText,
      },

      axisLine: {
        lineStyle: {
          color: theme.border,
        },
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
        type: "boxplot",

        data: [
          [
            lowerWhisker,
            q1,
            median,
            q3,
            upperWhisker,
          ],
        ],

        itemStyle: {
          color: "rgba(52,109,146,0.18)",
          borderColor: colors[0],
          borderWidth: 2,
        },

        emphasis: {
          itemStyle: {
            borderColor: colors[2],
            borderWidth: 3,
          },
        },
      },

      {
        name: "Outliers",
        type: "scatter",

        data: outliers.map((value) => [0, value]),

        symbolSize: 9,

        itemStyle: {
          color: colors[2],
        },
      },
    ],
  };
}

/* HEATMAP */

function buildHeatmapOption({
  data,
  xCol,
  yCol,
  theme,
}) {
  const xValues = [
    ...new Set(
      data.map((item) => String(item[xCol]))
    ),
  ];

  const yValues = [
    ...new Set(
      data.map((item) => String(item[yCol]))
    ),
  ];

  if (xValues.length === 0 || yValues.length === 0) {
    return {};
  }

  const yIndex = new Map(
    yValues.map((value, index) => [value, index])
  );

  const xIndex = new Map(
    xValues.map((value, index) => [value, index])
  );

  const counts = new Map();

  data.forEach((item) => {
    const x = String(item[xCol]);
    const y = String(item[yCol]);

    const key = `${x}|||${y}`;

    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const heatData = [];

  counts.forEach((count, key) => {
    const [x, y] = key.split("|||");

    heatData.push([
      xIndex.get(x),
      yIndex.get(y),
      count,
    ]);
  });

  const maxCount = Math.max(
    ...heatData.map((item) => item[2]),
    1
  );

  return {
    ...getCommonOption(theme),

    tooltip: {
      ...getCommonOption(theme).tooltip,

      trigger: "item",

      formatter: (params) => {
        const [x, y, count] = params.value;

        return `
          <strong>${escapeHtml(xValues[x])}</strong>
          <br/>
          ${escapeHtml(yCol)}: ${escapeHtml(yValues[y])}
          <br/>
          Count: ${count}
        `;
      },
    },

    visualMap: {
      min: 0,
      max: maxCount,

      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 5,

      textStyle: {
        color: theme.secondaryText,
      },

      inRange: {
        color: [
          "#fff4f0",
          "#fccb55",
          "#faaa47",
          "#f8536c",
          "#f087c8",
          "#346d92",
        ],
      },
    },

    grid: {
      top: 48,
      right: 25,
      bottom: 90,
      left: 80,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: xValues,

      axisLabel: {
        color: theme.mutedText,
        fontSize: 9,
        rotate: xValues.length > 10 ? 35 : 0,
      },

      axisLine: {
        lineStyle: {
          color: theme.border,
        },
      },
    },

    yAxis: {
      type: "category",
      data: yValues,

      axisLabel: {
        color: theme.mutedText,
        fontSize: 9,
      },

      axisLine: {
        lineStyle: {
          color: theme.border,
        },
      },
    },

    series: [
      {
        name: "Frequency",
        type: "heatmap",
        data: heatData,

        label: {
          show: xValues.length <= 15 && yValues.length <= 15,
          color: theme.text,
          fontSize: 10,
        },

        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: "rgba(0,0,0,0.2)",
          },
        },
      },
    ],
  };
}

/* CHART OPTION FACTORY */

function buildChartOption({
  type,
  data,
  xCol,
  yCol,
  colors,
}) {
  const theme = getThemeColors();

  const categories = data.map((item) => item[xCol]);
  const values = data.map((item) => toNumber(item[yCol]));

  if (type === "line") {
    return buildLineOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "stepLine") {
    return buildStepLineOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "bar") {
    return buildBarOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "horizontalBar") {
    return buildHorizontalBarOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "stackedBar") {
    return buildStackedBarOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "percentStackedBar") {
    return buildPercentStackedBarOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "area") {
    return buildAreaOption({
      xCol,
      yCol,
      categories,
      values,
      colors,
      theme,
    });
  }

  if (type === "scatter") {
    return buildScatterOption({
      data,
      xCol,
      yCol,
      colors,
      theme,
    });
  }

  if (type === "pie") {
    return buildPieOption({
      data,
      xCol,
      yCol,
      colors,
      theme,
      donut: false,
    });
  }

  if (type === "donut") {
    return buildPieOption({
      data,
      xCol,
      yCol,
      colors,
      theme,
      donut: true,
    });
  }

  if (type === "histogram") {
    return buildHistogramOption({
      data,
      yCol,
      colors,
      theme,
    });
  }

  if (type === "boxPlot") {
    return buildBoxPlotOption({
      data,
      xCol,
      yCol,
      colors,
      theme,
    });
  }

  if (type === "heatmap") {
    return buildHeatmapOption({
      data,
      xCol,
      yCol,
      colors,
      theme,
    });
  }

  return {};
}

/* DISPLAY NAMES */

const CHART_NAMES = {
  line: "Line Chart",
  stepLine: "Step Line",
  bar: "Bar Chart",
  horizontalBar: "Horizontal Bar",
  stackedBar: "Stacked Bar",
  percentStackedBar: "100% Stacked Bar",
  area: "Area Chart",
  scatter: "Scatter Plot",
  pie: "Pie Chart",
  donut: "Doughnut Chart",
  histogram: "Histogram",
  boxPlot: "Box Plot",
  heatmap: "Heatmap",
};

/* MAIN COMPONENT */

function ChartRenderer({
  data,
  xCol,
  yCol,
  chartType,
}) {
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
    return (
      <div className="chart-empty-state">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p>Unable to determine column types</p>
      </div>
    );
  }

  const suggestions = suggestCharts(
    types[xCol],
    types[yCol]
  );

  const chartsToRender =
    Array.isArray(chartType) && chartType.length > 0
      ? chartType
      : suggestions;

  const themeKey = isDarkMode() ? "dark" : "light";

  return (
    <div className="charts">
      {chartsToRender.map((type, index) => {
        const option = buildChartOption({
          type,
          data,
          xCol,
          yCol,
          colors: COLORS,
        });

        if (!option.series) {
          return null;
        }

        return (
          <div
            key={`${type}-${index}`}
            className="chart-wrapper"
          >
            <div className="chart-wrapper-header">
              <div>
                <h2>
                  {CHART_NAMES[type] ||
                    type.charAt(0).toUpperCase() +
                      type.slice(1)}
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
                  height: "380px",
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
