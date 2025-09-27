import React from "react";
import '../App.css';

function DatasetSelector({ datasets, activeDataset, setActiveDataset }) {
  return (
    <div className="dataset-selector">
      <label htmlFor="dataset">Select Dataset:</label>
      <select
        id="dataset"
        value={activeDataset ?? ""}
        onChange={(e) => setActiveDataset(Number(e.target.value))}
      >
        <option value="">--Choose--</option>
        {datasets.map((d, index) => (
          <option key={d.name} value={index}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DatasetSelector;
