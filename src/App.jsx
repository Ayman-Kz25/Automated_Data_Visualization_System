import React, { useState, useRef, useEffect, useMemo } from "react";
import FileUploader from "./components/FileUploader";
import DatasetSelector from "./components/DatasetSelector";
import ColumnSelector from "./components/ColumnSelector";
import ChartRenderer from "./components/ChartRenderer";
import InsightsPanel from "./components/InsightsPanel";
import ReportExporter from "./components/ReportExporter";
import TreeChart from "./components/TreeChart";
import DatasetSummary from './components/DatasetSummary';
import "./App.css";
import { summary } from "framer-motion/client";

function App() {
  const [theme, setTheme] = useState("light");
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [chartType, setChartType] = useState([]);
  const [treeLayout, setTreeLayout] = useState("vertical");

  const chartRef = useRef(null);
  const insightsRef = useRef(null);
  const summaryRef = useRef(null);

  const handleDatasetSelect = (index) => {
    setActiveDataset(Number(index));
  };

  const selectedData = useMemo(
    () =>
      activeDataset !== null && datasets[activeDataset]
        ? datasets[activeDataset].data || []
        : [],
    [activeDataset, datasets]
  );

  const columns = useMemo(
    () => (selectedData.length ? Object.keys(selectedData[0]) : []),
    [selectedData]
  );

  // Set default xCol/yCol when dataset changes
  useEffect(() => {
    if (columns.length > 0) {
      if (!xCol) setXCol(columns[0]);
      if (!yCol) setYCol(columns[1] || columns[0]);
    } else {
      setXCol("");
      setYCol("");
    }
  }, [columns]);

  // Automatically select first dataset if none selected
  useEffect(() => {
    if (datasets.length > 0 && activeDataset === null) {
      setActiveDataset(0);
    }
  }, [datasets, activeDataset]);

  // Custom chart render function for "customized" chart type
  const customChartFunction = (data) => {
    return (
      <svg width="100%" height="300">
        {data.map((entry, idx) => (
          <circle
            key={idx}
            cx={50 + idx * 60}
            cy={300 - entry[yCol] / 5}
            r={20}
            fill="#FEC89A"
          />
        ))}
      </svg>
    );
  };

  // Apply theme to body (so the whole app updates)
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const allChartTypes = [
    "line",
    "bar",
    "scatter",
    "area",
    "pie",
    "radar",
    "treemap",
    "funnel",
    "tree",
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <img
            src="./src/assets/pie-chart.png"
            alt="Logo"
            className="app-logo"
          />
        </div>

        <h1 className="header-title">Automated Data Visualization System</h1>

        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? (
              <i className="fa-solid fa-moon"></i>
            ) : (
              <i className="fa-solid fa-sun"></i>
            )}
          </button>
        </div>
      </header>

      {/* Wrapper for sidebar and main to enable side-by-side layout below header */}
      <div className="dashboard-layout">
        <aside className="sidebar">
          <h2>
            <i class="fa-solid fa-gear"></i> Controls
          </h2>

          <div className="control-group uploader">
            <FileUploader setDatasets={setDatasets} />
          </div>

          {datasets.length > 0 && (
            <>
              <div className="control-group dataset-selector">
                <DatasetSelector
                  datasets={datasets}
                  activeDataset={activeDataset}
                  setActiveDataset={handleDatasetSelect}
                />
              </div>

              {activeDataset !== null && columns.length > 0 && (
                <div className="control-group column-selector">
                  <ColumnSelector
                    columns={columns}
                    xCol={xCol}
                    yCol={yCol}
                    setXCol={setXCol}
                    setYCol={setYCol}
                  />
                </div>
              )}

              <div className="control-group chart-type-selector">
                <div className="chart-selector">
                  <label>Chart Type(s)</label>

                  <div>
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={chartType.length === allChartTypes.length}
                      onChange={(e) => {
                        setChartType(e.target.checked ? allChartTypes : []);
                      }}
                    />
                    <label htmlFor="selectAll">
                      <strong>Select All</strong>
                    </label>
                  </div>

                  {allChartTypes.map((chart) => (
                    <div key={chart}>
                      <input
                        type="checkbox"
                        id={chart}
                        value={chart}
                        checked={chartType.includes(chart)}
                        onChange={(e) =>
                          setChartType((prev) =>
                            e.target.checked
                              ? [...prev, chart]
                              : prev.filter((c) => c !== chart)
                          )
                        }
                      />
                      <label htmlFor={chart}>
                        {chart.charAt(0).toUpperCase() + chart.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {chartType.includes("tree") && (
                <div className="control-group">
                  <label>Tree Layout</label>
                  <select
                    value={treeLayout}
                    onChange={(e) => setTreeLayout(e.target.value)}
                  >
                    <option value="vertical">Vertical</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              )}
            </>
          )}
        </aside>

        <main className="dashboard-main">
          {xCol && yCol && selectedData.length > 0 && (
            <>
              <div ref={chartRef} className="chart-wrapper">
                <ChartRenderer
                  data={selectedData}
                  xCol={xCol}
                  yCol={yCol}
                  chartType={chartType}
                  customChart={customChartFunction}
                  treeLayout={treeLayout}
                />
              </div>

              <div className="summary" ref={summaryRef}>
              <DatasetSummary data={selectedData} />
              </div>

              <div ref={insightsRef} className="insights-wrapper">
                <InsightsPanel data={selectedData} xCol={xCol} yCol={yCol} />
                <div className="export-btn">
                  <ReportExporter
                    chartRef={chartRef}
                    insightsRef={insightsRef}
                    summaryRef={summaryRef}
                    xCol={xCol}
                    yCol={yCol}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
