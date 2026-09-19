import { useState, useRef, useEffect, useMemo } from "react";

import FileUploader from "./components/FileUploader.jsx";
import DatasetSelector from "./components/DatasetSelector.jsx";
import ColumnSelector from "./components/ColumnSelector.jsx";
import ChartRenderer from "./components/ChartRenderer.jsx";
import InsightsPanel from "./components/InsightsPanel.jsx";
import ReportExporter from "./components/ReportExporter.jsx";
import DatasetSummary from "./components/DatasetSummary.jsx";

import logo from "./assets/pie-chart.png";

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

  // Dataset selection
  const handleDatasetSelect = (index) => {
    setActiveDataset(Number(index));
  };

  // Automatically select first dataset
  const effectiveActiveDataset =
    activeDataset !== null ? activeDataset : datasets.length > 0 ? 0 : null;

  //  Selected dataset
  const selectedData = useMemo(
    () =>
      effectiveActiveDataset !== null && datasets[effectiveActiveDataset]
        ? datasets[effectiveActiveDataset].data || []
        : [],
    [effectiveActiveDataset, datasets],
  );

  //  Dataset columns
  const columns = useMemo(
    () => (selectedData.length ? Object.keys(selectedData[0]) : []),
    [selectedData],
  );

  // Automatically select columns
  const effectiveXCol = useMemo(() => {
    return xCol && columns.includes(xCol) ? xCol : columns[0];
  }, [columns, xCol]);

  const effectiveYCol = useMemo(() => {
    if (columns.length === 0) return "";
    return yCol && columns.includes(yCol) ? yCol : columns[1] || columns[0];
  }, [columns, yCol]);

  //  Theme
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) => (previous === "light" ? "dark" : "light"));
  };

  // Chart selection
  const toggleChartType = (chart) => {
    setChartType((previous) =>
      previous.includes(chart)
        ? previous.filter((item) => item !== chart)
        : [...previous, chart],
    );
  };

  const toggleAllCharts = () => {
    setChartType((previous) =>
      previous.length === allChartTypes.length ? [] : allChartTypes,
    );
  };

  // Custom chart
  const customChartFunction = (data) => {
    return (
      <svg width="100%" height="300">
        {data.map((entry, index) => (
          <circle
            key={index}
            cx={50 + index * 60}
            cy={300 - entry[effectiveYCol] / 5}
            r={20}
            fill="#FEC89A"
          />
        ))}
      </svg>
    );
  };

  const hasData = selectedData.length > 0;
  const activeDatasetName =
    effectiveActiveDataset !== null && datasets[effectiveActiveDataset]
      ? datasets[effectiveActiveDataset].name || `Dataset ${effectiveActiveDataset + 1}`
      : "No dataset selected";

  return (
    <div className={`app-container ${theme}`}>
      {/* Top Navigation */}
      <header className="topbar">
        <div className="brand-area">
          <div className="brand-logo">
            <img src={logo} alt="DataViz logo" />
          </div>

          <div className="brand-copy">
            <span className="brand-name">DataViz</span>
            <span className="brand-subtitle">Automated Data Visualization</span>
          </div>
        </div>

        <div className="topbar-center">
          {hasData && (
            <div className="dataset-status">
              <span className="status-dot"></span>

              <span>
                Working with <strong>{activeDatasetName}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="topbar-actions">
          {hasData && (
            <div className="data-indicator">
              <i className="fa-solid fa-table"></i>

              <span>{selectedData.length} rows</span>

              <span className="indicator-divider">•</span>

              <span>{columns.length} columns</span>
            </div>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <i className="fa-solid fa-moon"></i>
            ) : (
              <i className="fa-solid fa-sun"></i>
            )}
          </button>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="dashboard-shell">
        {/* Sidebar/Control Panel */}
        <aside className="control-panel">
          <div className="panel-heading">
            <div className="panel-heading-icon">
              <i className="fa-solid fa-sliders"></i>
            </div>

            <div>
              <h2>Workspace</h2>
              <p>Configure your visualization</p>
            </div>
          </div>

          {/* Upload */}
          <section className="control-section">
            <div className="section-label">
              <span className="section-number">01</span>
              <span>Import Data</span>
            </div>

            <div className="control-card uploader-card">
              <FileUploader setDatasets={setDatasets} />
            </div>
          </section>

          {datasets.length > 0 && (
            <>
              {/* Dataset */}
              <section className="control-section">
                <div className="section-label">
                  <span className="section-number">02</span>
                  <span>Dataset</span>
                </div>

                <div className="control-card">
                  <DatasetSelector
                    datasets={datasets}
                    activeDataset={effectiveActiveDataset}
                    setActiveDataset={handleDatasetSelect}
                  />
                </div>
              </section>

              {/* Columns */}
              {activeDataset !== null && columns.length > 0 && (
                <section className="control-section">
                  <div className="section-label">
                    <span className="section-number">03</span>
                    <span>Data Mapping</span>
                  </div>

                  <div className="control-card">
                    <ColumnSelector
                      columns={columns}
                      xCol={effectiveXCol}
                      yCol={effectiveYCol}
                      setXCol={setXCol}
                      setYCol={setYCol}
                    />
                  </div>
                </section>
              )}

              {/* Chart Types */}
              <section className="control-section">
                <div className="section-label">
                  <span className="section-number">04</span>
                  <span>Visualizations</span>
                </div>

                <div className="control-card chart-options-card">
                  <div className="chart-options-header">
                    <div>
                      <strong>Chart Types</strong>
                      <span>
                        {chartType.length === 0
                          ? "Automatic"
                          : `${chartType.length} selected`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="select-all-button"
                      onClick={toggleAllCharts}
                    >
                      {chartType.length === allChartTypes.length
                        ? "Clear"
                        : "All"}
                    </button>
                  </div>

                  <div className="chart-options-grid">
                    {allChartTypes.map((chart) => {
                      const selected = chartType.includes(chart);

                      return (
                        <label
                          key={chart}
                          className={`chart-option ${
                            selected ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleChartType(chart)}
                          />

                          <span className="chart-option-icon">
                            {chart === "line" && (
                              <i className="fa-solid fa-chart-line"></i>
                            )}

                            {chart === "bar" && (
                              <i className="fa-solid fa-chart-column"></i>
                            )}

                            {chart === "scatter" && (
                              <i className="fa-solid fa-braille"></i>
                            )}

                            {chart === "area" && (
                              <i className="fa-solid fa-chart-area"></i>
                            )}

                            {chart === "pie" && (
                              <i className="fa-solid fa-chart-pie"></i>
                            )}

                            {chart === "radar" && (
                              <i className="fa-solid fa-spider"></i>
                            )}

                            {chart === "treemap" && (
                              <i className="fa-solid fa-table-cells-large"></i>
                            )}

                            {chart === "funnel" && (
                              <i className="fa-solid fa-filter"></i>
                            )}

                            {chart === "tree" && (
                              <i className="fa-solid fa-sitemap"></i>
                            )}
                          </span>

                          <span className="chart-option-name">
                            {chart.charAt(0).toUpperCase() + chart.slice(1)}
                          </span>

                          <span className="chart-check">
                            {selected && <i className="fa-solid fa-check"></i>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Tree Layout */}
              {chartType.includes("tree") && (
                <section className="control-section">
                  <div className="section-label">
                    <span className="section-number">05</span>
                    <span>Tree Layout</span>
                  </div>

                  <div className="control-card layout-card">
                    <label htmlFor="tree-layout">Layout orientation</label>

                    <select
                      id="tree-layout"
                      value={treeLayout}
                      onChange={(event) => setTreeLayout(event.target.value)}
                    >
                      <option value="vertical">Vertical</option>

                      <option value="radial">Radial</option>
                    </select>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Sidebar footer */}
          <div className="panel-footer">
            <div className="system-status">
              <span className="status-dot"></span>

              <div>
                <strong>Visualization engine ready</strong>
                <span>System operational</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}

        <main className="dashboard-main">
          {!hasData ? (
            /* Empty State */
            <div className="empty-dashboard">
              <div className="empty-illustration">
                <div className="empty-circle">
                  <i className="fa-solid fa-chart-pie"></i>
                </div>

                <div className="empty-decoration empty-decoration-one">
                  <i className="fa-solid fa-chart-line"></i>
                </div>

                <div className="empty-decoration empty-decoration-two">
                  <i className="fa-solid fa-chart-column"></i>
                </div>
              </div>

              <div className="empty-content">
                <span className="eyebrow">DATA VISUALIZATION WORKSPACE</span>

                <h1>
                  Turn raw data into
                  <span> meaningful visuals.</span>
                </h1>

                <p>
                  Upload a CSV or Excel dataset to begin exploring patterns,
                  relationships, trends, and insights through interactive
                  visualizations.
                </p>

                <div className="empty-features">
                  <div>
                    <i className="fa-solid fa-upload"></i>
                    <span>Upload data</span>
                  </div>

                  <div>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Auto visualize</span>
                  </div>

                  <div>
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Discover insights</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Dataset Dashboard
            <div className="workspace">
              {/* Dashboard heading */}
              <div className="workspace-header">
                <div>
                  <div className="breadcrumb">
                    <span>Workspace</span>
                    <i className="fa-solid fa-chevron-right"></i>
                    <strong>{activeDatasetName}</strong>
                  </div>

                  <h1>Data Exploration</h1>

                  <p>
                    Explore your dataset through interactive visualizations and
                    automated insights.
                  </p>
                </div>

                <div className="workspace-actions">
                  <div className="active-columns">
                    <div className="column-pill">
                      <span>X</span>
                      {effectiveXCol}
                    </div>

                    <div className="column-pill">
                      <span>Y</span>
                      {effectiveYCol}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dataset quick stats */}
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-table"></i>
                  </div>

                  <div>
                    <span>Rows</span>
                    <strong>{selectedData.length.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-columns"></i>
                  </div>

                  <div>
                    <span>Columns</span>
                    <strong>{columns.length}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-chart-simple"></i>
                  </div>

                  <div>
                    <span>Visualizations</span>
                    <strong>
                      {chartType.length === 0 ? "Auto" : chartType.length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fa-solid fa-layer-group"></i>
                  </div>

                  <div>
                    <span>Datasets</span>
                    <strong>{datasets.length}</strong>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              <section className="dashboard-card visualization-card">
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="card-icon">
                      <i className="fa-solid fa-chart-line"></i>
                    </div>

                    <div>
                      <h2>Visualizations</h2>

                      <p>
                        {chartType.length === 0
                          ? "Recommended charts based on your data"
                          : `${chartType.length} chart types selected`}
                      </p>
                    </div>
                  </div>

                  <div className="visualization-meta">
                    <span className="live-indicator">
                      <span></span>
                      Live
                    </span>
                  </div>
                </div>

                <div ref={chartRef} className="chart-workspace">
                  {effectiveXCol && yCol && (
                    <ChartRenderer
                      data={selectedData}
                      xCol={effectiveXCol}
                      yCol={effectiveYCol}
                      chartType={chartType}
                      customChart={customChartFunction}
                      treeLayout={treeLayout}
                    />
                  )}
                </div>
              </section>

              {/* Analytics Grid */}
              <div className="analytics-grid">
                {/* Dataset Summary */}
                <section
                  ref={summaryRef}
                  className="dashboard-card summary-card"
                >
                  <div className="card-header">
                    <div className="card-title-group">
                      <div className="card-icon">
                        <i className="fa-solid fa-table-list"></i>
                      </div>

                      <div>
                        <h2>Dataset Summary</h2>
                        <p>Statistical overview of your data</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <DatasetSummary data={selectedData} />
                  </div>
                </section>

                {/* Insights */}
                <section
                  ref={insightsRef}
                  className="dashboard-card insights-card"
                >
                  <div className="card-header">
                    <div className="card-title-group">
                      <div className="card-icon">
                        <i className="fa-solid fa-lightbulb"></i>
                      </div>

                      <div>
                        <h2>Automated Insights</h2>
                        <p>Patterns detected in your dataset</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <InsightsPanel
                      data={selectedData}
                      xCol={effectiveXCol}
                      yCol={effectiveYCol}
                    />
                  </div>
                </section>
              </div>

              {/* Export */}
              <section className="export-section">
                <div className="export-content">
                  <div className="export-icon">
                    <i className="fa-solid fa-file-pdf"></i>
                  </div>

                  <div>
                    <h3>Export your analysis</h3>

                    <p>
                      Generate a PDF report containing your visualizations,
                      dataset summary, and insights.
                    </p>
                  </div>
                </div>

                <div className="export-action">
                  <ReportExporter
                    chartRef={chartRef}
                    insightsRef={insightsRef}
                    summaryRef={summaryRef}
                    xCol={effectiveXCol}
                    yCol={effectiveYCol}
                  />
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
