import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import "../App.css";

function correlation(x, y) {
  const meanX = d3.mean(x);
  const meanY = d3.mean(y);

  const numerator = d3.sum(x.map((val, i) => (val - meanX) * (y[i] - meanY)));
  const denominator = Math.sqrt(
    d3.sum(x.map((val) => Math.pow(val - meanX, 2))) *
      d3.sum(y.map((val) => Math.pow(val - meanY, 2)))
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

// 🔹 Skewness helper
function skewness(arr) {
  const mean = d3.mean(arr);
  const std = d3.deviation(arr);
  const n = arr.length;
  if (!std || std === 0) return 0;
  return (
    (n / ((n - 1) * (n - 2))) *
    d3.sum(arr.map((val) => Math.pow((val - mean) / std, 3)))
  );
}

function InsightsPanel({ data, xCol, yCol }) {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!data || !xCol || !yCol) return;

    const newInsights = [];
    const numericPairs = data.filter(
      (d) => typeof d[xCol] === "number" && typeof d[yCol] === "number"
    );
    const xVals = numericPairs.map((d) => d[xCol]);
    const yVals = numericPairs.map((d) => d[yCol]);

    // 🔹 Correlation
    if (xVals.length && yVals.length) {
      const corr = correlation(xVals, yVals).toFixed(2);
      if (corr > 0.7)
        newInsights.push(
          <span style={{ color: "green" }}>
            <i className="fa-solid fa-link"></i> Strong Positive Correlation ({corr}) between <b>{xCol}</b> and <b>{yCol}</b>.
          </span>
        );
      else if (corr < -0.7)
        newInsights.push(
          <span style={{ color: "red" }}>
            <i className="fa-solid fa-link"></i> Strong Negative Correlation ({corr}) between <b>{xCol}</b> and <b>{yCol}</b>.
          </span>
        );
      else
        newInsights.push(
          <span style={{ color: "#6b7280" }}>
            <i className="fa-solid fa-link"></i> Weak or No significant correlation ({corr}) between <b>{xCol}</b> and <b>{yCol}</b>.
          </span>
        );
    }

    // 🔹 Category Dominance
    const isXCategory = typeof data[0]?.[xCol] === "string";
    if (isXCategory) {
      const counts = d3.rollup(data, (v) => v.length, (d) => d[xCol]);
      const topCategory = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        newInsights.push(
          <span style={{ color: "#f59e0b" }}>
            <i className="fa-solid fa-crown"></i> Category <b>{topCategory[0]}</b> appears most frequently ({topCategory[1]} times).
          </span>
        );
      }
    }

    // 🔹 Max/Min
    if (numericPairs.length > 0) {
      const maxRow = d3.greatest(numericPairs, (d) => d[yCol]);
      const minRow = d3.least(numericPairs, (d) => d[yCol]);
      newInsights.push(
        <span style={{ color: "blue" }}>
          <i className="fa-solid fa-arrow-up"></i> Maximum <b>{yCol}</b> is {maxRow[yCol]} (at <b>{xCol}</b>: {maxRow[xCol]}).
        </span>
      );
      newInsights.push(
        <span style={{ color: "purple" }}>
          <i className="fa-solid fa-arrow-down"></i> Minimum <b>{yCol}</b> is {minRow[yCol]} (at <b>{xCol}</b>: {minRow[xCol]}).
        </span>
      );
    }

    // 🔹 Outliers
    if (yVals.length > 0) {
      const mean = d3.mean(yVals);
      const std = d3.deviation(yVals);
      const outliers = numericPairs.filter(
        (d) => Math.abs(d[yCol] - mean) > 2 * std
      );
      if (outliers.length > 0) {
        newInsights.push(
          <span style={{ color: "#dc2626" }}>
            <i className="fa-solid fa-triangle-exclamation"></i> {outliers.length} outlier(s) detected in <b>{yCol}</b>, far from the mean ({mean.toFixed(2)}).
          </span>
        );
      }
    }

    // 🔹 Spread (Variance & StdDev)
    if (yVals.length > 0) {
      const std = d3.deviation(yVals).toFixed(2);
      const variance = d3.variance(yVals).toFixed(2);
      newInsights.push(
        <span style={{ color: "#2563eb" }}>
          <i className="fa-solid fa-chart-area"></i> <b>{yCol}</b> has a standard deviation of {std} and variance of {variance}.
        </span>
      );
    }

    // 🔹 Skewness
    if (yVals.length > 0) {
      const skew = skewness(yVals).toFixed(2);
      if (skew > 1) {
        newInsights.push(
          <span style={{ color: "#eab308" }}>
            <i className="fa-solid fa-arrow-trend-up"></i> <b>{yCol}</b> distribution is positively skewed ({skew}).
          </span>
        );
      } else if (skew < -1) {
        newInsights.push(
          <span style={{ color: "#a855f7" }}>
            <i className="fa-solid fa-arrow-trend-down"></i> <b>{yCol}</b> distribution is negatively skewed ({skew}).
          </span>
        );
      } else {
        newInsights.push(
          <span style={{ color: "#6b7280" }}>
            <i className="fa-solid fa-arrows-left-right"></i> <b>{yCol}</b> distribution is approximately normal ({skew}).
          </span>
        );
      }
    }

    // 🔹 Missing Data Insights
    const missingSummary = Object.keys(data[0] || {}).map((col) => {
      const missingCount = data.filter((d) => d[col] == null || d[col] === "").length;
      return { col, missingCount };
    }).filter((d) => d.missingCount > 0);

    if (missingSummary.length > 0) {
      const topMissing = missingSummary.sort((a, b) => b.missingCount - a.missingCount)[0];
      newInsights.push(
        <span style={{ color: "#ef4444" }}>
          <i className="fa-solid fa-ban"></i> Column <b>{topMissing.col}</b> has {topMissing.missingCount} missing values.
        </span>
      );
    }

    // 🔹 Category Impact on Y
    if (isXCategory && yVals.length > 0) {
      const grouped = d3.rollups(
        numericPairs,
        (v) => d3.mean(v, (d) => d[yCol]),
        (d) => d[xCol]
      );
      const sorted = grouped.sort((a, b) => b[1] - a[1]);
      if (sorted.length > 1) {
        newInsights.push(
          <span style={{ color: "#10b981" }}>
            <i className="fa-solid fa-chart-column"></i> Category <b>{sorted[0][0]}</b> has the highest average {yCol} ({sorted[0][1].toFixed(
              2
            )}), while <b>{sorted[sorted.length - 1][0]}</b> has the lowest ({sorted[sorted.length - 1][1].toFixed(2)}).
          </span>
        );
      }
    }

    // 🔹 Trend Analysis
    const sampleVal = data[0]?.[xCol];
    if (
      sampleVal &&
      (sampleVal instanceof Date || !isNaN(Date.parse(sampleVal)))
    ) {
      const parsed = data
        .map((d) => ({
          x: new Date(d[xCol]),
          y: +d[yCol],
        }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y))
        .sort((a, b) => a.x - b.x);

      if (parsed.length > 1) {
        const xNums = parsed.map((d, i) => i);
        const yNums = parsed.map((d) => d.y);
        const meanX = d3.mean(xNums);
        const meanY = d3.mean(yNums);
        const slope =
          d3.sum(xNums.map((x, i) => (x - meanX) * (yNums[i] - meanY))) /
          d3.sum(xNums.map((x) => Math.pow(x - meanX, 2)));

        if (slope > 0.1) {
          newInsights.push(
            <span style={{ color: "green" }}>
              <i className="fa-solid fa-chart-line"></i> <b>{yCol}</b> shows an upward trend over time (<b>{xCol}</b>).
            </span>
          );
        } else if (slope < -0.1) {
          newInsights.push(
            <span style={{ color: "red" }}>
              <i className="fa-solid fa-chart-line"></i> <b>{yCol}</b> shows a downward trend over time (<b>{xCol}</b>).
            </span>
          );
        } else {
          newInsights.push(
            <span style={{ color: "#6b7280" }}>
              <i className="fa-solid fa-chart-line"></i> <b>{yCol}</b> remains stable over time (<b>{xCol}</b>).
            </span>
          );
        }
      }
    }

    setInsights(newInsights);
  }, [data, xCol, yCol]);

  return (
    <div className="insights-panel">
      <h2>Insights Report</h2>
      {insights.length > 0 ? (
        <ul>
          {insights.map((insight, i) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      ) : (
        <p>No insights available! Please select valid columns.</p>
      )}
    </div>
  );
}

export default InsightsPanel;
