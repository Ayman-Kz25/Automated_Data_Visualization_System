import { useEffect, useMemo } from "react";

function ColumnSelector({
  columns,
  xCol,
  yCol,
  setXCol,
  setYCol,
}) {
  /* NORMALIZE COLUMNS */
  const availableColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      return [];
    }

    return columns.filter(
      (column) =>
        typeof column === "string" &&
        column.trim().length > 0
    );
  }, [columns]);

  /* AUTO SELECT DEFAULT COLUMNS */
  useEffect(() => {
    if (availableColumns.length === 0) {
      return;
    }

    const xExists = availableColumns.includes(xCol);
    const yExists = availableColumns.includes(yCol);

    /*
     * If the current X column no longer exists,
     * select the first available column.
     */
    if (!xExists) {
      setXCol(availableColumns[0]);
    }

    /*
     * If the current Y column no longer exists,
     * select the second available column when possible.
     */
    if (!yExists) {
      setYCol(
        availableColumns.length > 1
          ? availableColumns[1]
          : availableColumns[0]
      );
    }
  }, [
    availableColumns,
    xCol,
    yCol,
    setXCol,
    setYCol,
  ]);

  /* EMPTY STATE */
  if (availableColumns.length === 0) {
    return (
      <div className="column-selector-empty">
        <i className="fa-solid fa-table-columns"></i>

        <div>
          <strong>No columns detected</strong>

          <p>
            Please upload a valid CSV or Excel file.
          </p>
        </div>
      </div>
    );
  }

  /* SELECTED VALUES */
  const selectedX = availableColumns.includes(xCol)
    ? xCol
    : availableColumns[0];

  const selectedY = availableColumns.includes(yCol)
    ? yCol
    : availableColumns.length > 1
      ? availableColumns[1]
      : availableColumns[0];

  /* RENDER */
  return (
    <div className="column-selector">
      {/* X AXIS */}
      <div className="column-selector-field">
        <label htmlFor="x-column">
          <span className="column-selector-label">
            X-Axis
          </span>

          <span className="column-selector-hint">
            Category / independent<br/> variable
          </span>
        </label>

        <select
          id="x-column"
          name="x-column"
          value={selectedX}
          onChange={(event) =>
            setXCol(event.target.value)
          }
          aria-label="Select X-Axis column"
        >
          {availableColumns.map((column) => (
            <option key={`x-${column}`} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      {/* Y AXIS */}
      <div className="column-selector-field">
        <label htmlFor="y-column">
          <span className="column-selector-label">
            Y-Axis
          </span>

          <span className="column-selector-hint">
            Numeric / dependent <br /> variable
          </span>
        </label>

        <select
          id="y-column"
          name="y-column"
          value={selectedY}
          onChange={(event) =>
            setYCol(event.target.value)
          }
          aria-label="Select Y-Axis column"
        >
          {availableColumns.map((column) => (
            <option key={`y-${column}`} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ColumnSelector;
