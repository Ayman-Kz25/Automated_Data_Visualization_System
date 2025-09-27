import React, { useEffect } from "react";

function ColumnSelector({ columns, xCol, yCol, setXCol, setYCol }) {
  // Auto-select first columns if none chosen
  useEffect(() => {
    if (columns && columns.length > 0) {
      if (!xCol) setXCol(columns[0]);
      if (!yCol && columns.length > 1) setYCol(columns[1]);
    }
  }, [columns, xCol, yCol, setXCol, setYCol]);

  if (!Array.isArray(columns) || columns.length === 0) {
    return <p>No columns detected. Please upload a valid file.</p>;
  }

  return (
    <div className="column-selector">
      <div>
        <label>X-Axis:</label>
        <select
          value={xCol || ""}
          onChange={(e) => setXCol(e.target.value)}
        >
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Y-Axis:</label>
        <select
          value={yCol || ""}
          onChange={(e) => setYCol(e.target.value)}
        >
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ColumnSelector;
