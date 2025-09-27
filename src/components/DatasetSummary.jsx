import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import "../App.css";

function DatasetSummary({ data }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const columns = Object.keys(data[0]);
    const summaryData = columns.map((col) => {
      const values = data.map((d) => d[col]).filter((v) => v !== null && v !== undefined && v !== "");
      const missing = data.length - values.length;
      const uniqueVals = new Set(values).size;

      let type = "string";
      if (values.every((v) => typeof v === "number")) {
        type = "number";
      } else if (values.every((v) => !isNaN(Date.parse(v)))) {
        type = "date";
      }

      let stats = {};
      if (type === "number") {
        const nums = values.map((v) => +v);
        stats = {
          mean: d3.mean(nums).toFixed(2),
          median: d3.median(nums).toFixed(2),
          std: d3.deviation(nums).toFixed(2),
          min: d3.min(nums),
          max: d3.max(nums),
        };
      }

      return {
        column: col,
        type,
        count: values.length,
        missing,
        unique: uniqueVals,
        ...stats,
      };
    });

    setSummary(summaryData);
  }, [data]);

  return (
    <div className="dataset-summary">
      <h2>Dataset Summary</h2>
      {summary.length > 0 ? (
        <table className="summary-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Count</th>
              <th>Missing</th>
              <th>Unique</th>
              <th>Mean</th>
              <th>Median</th>
              <th>Std Dev</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s, i) => (
              <tr key={i}>
                <td>{s.column}</td>
                <td>{s.type}</td>
                <td>{s.count}</td>
                <td style={{ color: s.missing > 0 ? "red" : "inherit" }}>
                  {s.missing}
                </td>
                <td>{s.unique}</td>
                <td>{s.mean || "-"}</td>
                <td>{s.median || "-"}</td>
                <td>{s.std || "-"}</td>
                <td>{s.min || "-"}</td>
                <td>{s.max || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available! Please upload a dataset.</p>
      )}
    </div>
  );
}

export default DatasetSummary;
