import { useMemo } from "react";
import * as d3 from "d3";

/* HELPERS */
const isEmptyValue = (value) =>
  value === null ||
  value === undefined ||
  String(value).trim() === "";

const isNumericValue = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value
    .replace(/,/g, "")
    .replace(/[$€£¥%]/g, "")
    .trim();

  if (!normalized) {
    return false;
  }

  return Number.isFinite(Number(normalized));
};

const toNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/,/g, "")
    .replace(/[$€£¥%]/g, "")
    .trim();

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
};

const isDateValue = (value) => {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  /*
   * Avoid classifying ordinary numbers such as "2024"
   * as dates.
   */
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return false;
  }

  const timestamp = Date.parse(trimmed);

  return !Number.isNaN(timestamp);
};

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

const getColumnType = (values) => {
  if (values.length === 0) {
    return "string";
  }

  const numericCount = values.filter(isNumericValue).length;

  if (numericCount === values.length) {
    return "number";
  }

  const dateCount = values.filter(isDateValue).length;

  /*
   * Require most non-empty values to be dates.
   * This prevents a mixed text column from being classified
   * as a date because of one valid date.
   */
  if (dateCount / values.length >= 0.8) {
    return "date";
  }

  return "string";
};

const getTypeIcon = (type) => {
  switch (type) {
    case "number":
      return "fa-solid fa-hashtag";

    case "date":
      return "fa-solid fa-calendar-days";

    default:
      return "fa-solid fa-font";
  }
};

/* SUMMARY CALCULATION */
const buildSummary = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const columns = Object.keys(data[0] || {});

  return columns.map((column) => {
    const rawValues = data.map((row) => row?.[column]);

    const values = rawValues.filter(
      (value) => !isEmptyValue(value)
    );

    const missing = data.length - values.length;

    const unique = new Set(
      values.map((value) => String(value))
    ).size;

    const type = getColumnType(values);

    const result = {
      column,
      type,
      count: values.length,
      missing,
      unique,
    };

    /* NUMERIC STATISTICS */
    if (type === "number") {
      const numbers = values
        .map(toNumber)
        .filter((value) => value !== null);

      if (numbers.length > 0) {
        const mean = d3.mean(numbers);
        const median = d3.median(numbers);
        const deviation =
          numbers.length > 1
            ? d3.deviation(numbers)
            : 0;

        result.mean = mean;
        result.median = median;
        result.std = deviation ?? 0;
        result.min = d3.min(numbers);
        result.max = d3.max(numbers);
      }
    }

    return result;
  });
};

/* MAIN COMPONENT */
function DatasetSummary({ data }) {
  const summary = useMemo(
    () => buildSummary(data),
    [data]
  );

  /* DATASET METRICS */
  const metrics = useMemo(() => {
    if (!summary.length) {
      return {
        columns: 0,
        rows: 0,
        numeric: 0,
        missing: 0,
      };
    }

    return {
      columns: summary.length,
      rows: Array.isArray(data) ? data.length : 0,

      numeric: summary.filter(
        (item) => item.type === "number"
      ).length,

      missing: summary.reduce(
        (total, item) => total + item.missing,
        0
      ),
    };
  }, [summary, data]);

  /* EMPTY STATE */
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <section className="dataset-summary">
        <div className="dataset-summary-header">
          <div>
            <span className="dataset-summary-eyebrow">
              DATASET PROFILE
            </span>

            <h2>Dataset Summary</h2>
          </div>
        </div>

        <div className="dataset-summary-empty">
          <div className="dataset-summary-empty-icon">
            <i className="fa-solid fa-database"></i>
          </div>

          <div>
            <strong>No dataset available</strong>

            <p>
              Upload a CSV or Excel file to inspect its
              structure and statistics.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* RENDER */
  return (
    <section className="dataset-summary">
      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="dataset-summary-header">
        <div>
          <span className="dataset-summary-eyebrow">
            DATASET PROFILE
          </span>

          <h2>Dataset Summary</h2>

          <p>
            Structure, data types, completeness, and
            descriptive statistics.
          </p>
        </div>

        <div className="dataset-summary-header-icon">
          <i className="fa-solid fa-chart-simple"></i>
        </div>
      </div>

      {/* METRICS */}
      <div className="dataset-summary-metrics">
        <div className="summary-metric">
          <span className="summary-metric-icon">
            <i className="fa-solid fa-table-columns"></i>
          </span>

          <div>
            <span className="summary-metric-label">
              Columns
            </span>

            <strong>{metrics.columns}</strong>
          </div>
        </div>

        <div className="summary-metric">
          <span className="summary-metric-icon">
            <i className="fa-solid fa-list"></i>
          </span>

          <div>
            <span className="summary-metric-label">
              Rows
            </span>

            <strong>
              {formatNumber(metrics.rows)}
            </strong>
          </div>
        </div>

        <div className="summary-metric">
          <span className="summary-metric-icon">
            <i className="fa-solid fa-hashtag"></i>
          </span>

          <div>
            <span className="summary-metric-label">
              Numeric
            </span>

            <strong>{metrics.numeric}</strong>
          </div>
        </div>

        <div className="summary-metric">
          <span
            className={`summary-metric-icon ${
              metrics.missing > 0
                ? "summary-metric-warning"
                : "summary-metric-success"
            }`}
          >
            <i
              className={
                metrics.missing > 0
                  ? "fa-solid fa-triangle-exclamation"
                  : "fa-solid fa-check"
              }
            ></i>
          </span>

          <div>
            <span className="summary-metric-label">
              Missing
            </span>

            <strong>{metrics.missing}</strong>
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="dataset-summary-table-container">
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
            {summary.map((item) => {
              const missingPercent =
                metrics.rows > 0
                  ? (item.missing / metrics.rows) * 100
                  : 0;

              return (
                <tr key={item.column}>
                  {/* COLUMN */}

                  <td>
                    <div className="summary-column-name">
                      <span>
                        {item.column}
                      </span>
                    </div>
                  </td>

                  {/* TYPE */}
                  <td>
                    <span
                      className={`summary-type summary-type-${item.type}`}
                    >
                      <i
                        className={getTypeIcon(item.type)}
                      ></i>

                      {item.type}
                    </span>
                  </td>

                  {/* COUNT */}
                  <td>
                    {formatNumber(item.count)}
                  </td>

                  {/* MISSING */}
                  <td>
                    <div className="summary-missing">
                      <span
                        className={
                          item.missing > 0
                            ? "missing-value"
                            : "complete-value"
                        }
                      >
                        {formatNumber(item.missing)}
                      </span>

                      {item.missing > 0 && (
                        <span className="missing-percent">
                          {formatPercent(
                            missingPercent
                          )}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* UNIQUE */}
                  <td>
                    {formatNumber(item.unique)}
                  </td>

                  {/* STATISTICS */}
                  <td>
                    {formatNumber(item.mean)}
                  </td>

                  <td>
                    {formatNumber(item.median)}
                  </td>

                  <td>
                    {formatNumber(item.std)}
                  </td>

                  <td>
                    {formatNumber(item.min)}
                  </td>

                  <td>
                    {formatNumber(item.max)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="dataset-summary-footer">
        <span>
          <i className="fa-solid fa-circle-info"></i>
          {summary.length} columns analyzed across{" "}
          {formatNumber(metrics.rows)} rows
        </span>

        {metrics.missing > 0 ? (
          <span className="footer-warning">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Missing values detected
          </span>
        ) : (
          <span className="footer-success">
            <i className="fa-solid fa-circle-check"></i>
            No missing values detected
          </span>
        )}
      </div>
    </section>
  );
}

export default DatasetSummary;
