import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = [
  "csv",
  "xls",
  "xlsx",
  "json",
  "txt",
  "log",
];

function FileUploader({ setDatasets }) {
  const fileInputRef = useRef(null);

  const [workbookData, setWorkbookData] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${
      units[index]
    }`;
  };

  const setSuccess = (message) => {
    setStatus({
      type: "success",
      message,
    });
  };

  const setError = (message) => {
    setStatus({
      type: "error",
      message,
    });
  };

  const setInfo = (message) => {
    setStatus({
      type: "info",
      message,
    });
  };

  const isEmptyValue = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  };

  const convertValue = (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    if (trimmed === "") {
      return null;
    }

    const lowerValue = trimmed.toLowerCase();

    if (lowerValue === "true") {
      return true;
    }

    if (lowerValue === "false") {
      return false;
    }

    const numericValue = trimmed
      .replace(/[$,%]/g, "")
      .replace(/,/g, "");

    if (
      numericValue !== "" &&
      /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(numericValue)
    ) {
      return Number(numericValue);
    }

    return trimmed;
  };

  const normalizeHeaders = (headers) => {
    const usedHeaders = new Map();

    return headers.map((header, index) => {
      let name =
        header !== null &&
        header !== undefined &&
        String(header).trim() !== ""
          ? String(header).trim()
          : `Column_${index + 1}`;

      const normalizedName = name.toLowerCase();

      if (usedHeaders.has(normalizedName)) {
        const count = usedHeaders.get(normalizedName) + 1;
        usedHeaders.set(normalizedName, count);
        name = `${name}_${count}`;
      } else {
        usedHeaders.set(normalizedName, 1);
      }

      return name;
    });
  };

  const rowsFromMatrix = (matrix) => {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      return [];
    }

    const rawHeaders = Array.isArray(matrix[0]) ? matrix[0] : [];
    const headers = normalizeHeaders(rawHeaders);

    return matrix.slice(1).map((row) => {
      const safeRow = Array.isArray(row) ? row : [];
      const object = {};

      headers.forEach((header, index) => {
        object[header] = safeRow[index] ?? null;
      });

      return object;
    });
  };

  const cleanAndSetData = (rawData, fileName) => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      setError("No data was found in this file.");
      return false;
    }

    const cleanData = rawData.filter((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }

      return Object.values(row).some((value) => !isEmptyValue(value));
    });

    if (cleanData.length === 0) {
      setError("The file does not contain any readable data.");
      return false;
    }

    const typedData = cleanData.map((row) => {
      const newRow = {};

      Object.entries(row).forEach(([key, value]) => {
        newRow[key] = convertValue(value);
      });

      return newRow;
    });

    const columns = Object.keys(typedData[0] || {});

    if (columns.length === 0) {
      setError("No columns could be detected in this file.");
      return false;
    }

    let added = false;

    setDatasets((previousDatasets) => {
      const datasets = Array.isArray(previousDatasets)
        ? previousDatasets
        : [];

      const duplicate = datasets.some(
        (dataset) => dataset?.name === fileName
      );

      if (duplicate) {
        return datasets;
      }

      added = true;

      return [
        ...datasets,
        {
          name: fileName,
          data: typedData,
          columns,
          rowCount: typedData.length,
          columnCount: columns.length,
        },
      ];
    });

    if (!added) {
      setInfo("This file has already been uploaded.");
      return false;
    }

    setSuccess(
      `Imported ${typedData.length.toLocaleString()} rows · ${columns.length} columns`
    );

    return true;
  };

  const processCsv = (file) => {
    setInfo("Parsing CSV...");

    Papa.parse(file, {
      header: false,
      skipEmptyLines: "greedy",
      encoding: "UTF-8",

      complete: (result) => {
        try {
          if (!result.data || result.data.length === 0) {
            setError("The CSV file is empty.");
            return;
          }

          if (result.errors?.length > 0) {
            const criticalErrors = result.errors.filter(
              (error) =>
                error.type === "Quotes" ||
                error.type === "FieldMismatch"
            );

            if (criticalErrors.length > 0) {
              console.warn("CSV parsing warnings:", result.errors);
            }
          }

          const imported = cleanAndSetData(
            rowsFromMatrix(result.data),
            file.name
          );

          if (imported) {
            setInfo(
              `CSV imported · ${result.data.length.toLocaleString()} rows detected`
            );
          }
        } catch (error) {
          console.error("CSV processing error:", error);
          setError("Failed to process the CSV file.");
        } finally {
          setIsProcessing(false);
        }
      },

      error: (error) => {
        console.error("CSV parsing error:", error);
        setError("Failed to parse the CSV file.");
        setIsProcessing(false);
      },
    });
  };

  const processExcel = (file) => {
    setInfo("Reading Excel workbook...");

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result;

        if (!arrayBuffer) {
          throw new Error("Unable to read file.");
        }

        const data = new Uint8Array(arrayBuffer);

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          cellNF: false,
          cellText: true,
        });

        if (!workbook.SheetNames?.length) {
          setError("The Excel workbook does not contain any sheets.");
          return;
        }

        const firstSheetName = workbook.SheetNames[0];

        setWorkbookData({
          workbook,
          fileName: file.name,
        });

        setSheets(workbook.SheetNames);
        setSelectedSheet(firstSheetName);

        processExcelSheet(
          workbook,
          firstSheetName,
          file.name,
          workbook.SheetNames.length > 1
        );
      } catch (error) {
        console.error("Excel parsing error:", error);
        setError(
          "Failed to parse the Excel file. It may be corrupted, protected, or unsupported."
        );
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the Excel file.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const processExcelSheet = (
    workbook,
    sheetName,
    fileName,
    hasMultipleSheets = false
  ) => {
    try {
      const worksheet = workbook?.Sheets?.[sheetName];

      if (!worksheet) {
        setError(`Could not find the "${sheetName}" worksheet.`);
        return;
      }

      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true,
      });

      if (!matrix || matrix.length === 0) {
        setError(`The "${sheetName}" worksheet is empty.`);
        return;
      }

      const rows = rowsFromMatrix(matrix);
      const datasetName = `${fileName} - ${sheetName}`;

      const imported = cleanAndSetData(rows, datasetName);

      if (imported) {
        setInfo(
          hasMultipleSheets
            ? `Imported "${sheetName}"`
            : `Excel sheet "${sheetName}" imported`
        );
      }
    } catch (error) {
      console.error("Excel sheet processing error:", error);
      setError(`Failed to process the "${sheetName}" worksheet.`);
    }
  };

  const processJson = (file) => {
    setInfo("Parsing JSON...");

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;

        if (!content || !content.trim()) {
          setError("The JSON file is empty.");
          return;
        }

        const parsed = JSON.parse(content);

        let rows;

        if (Array.isArray(parsed)) {
          rows = parsed;
        } else if (parsed && typeof parsed === "object") {
          rows = [parsed];
        } else {
          setError("JSON must contain an object or an array of objects.");
          return;
        }

        const validRows = rows.filter(
          (row) => row && typeof row === "object" && !Array.isArray(row)
        );

        if (validRows.length === 0) {
          setError("No usable objects were found in the JSON file.");
          return;
        }

        cleanAndSetData(validRows, file.name);
      } catch (error) {
        console.error("JSON parsing error:", error);
        setError("Invalid JSON file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the JSON file.");
      setIsProcessing(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  const processText = (file) => {
    setInfo("Reading text file...");

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;

        if (!content || !content.trim()) {
          setError("The text file is empty.");
          return;
        }

        const lines = content.split(/\r?\n/);

        const rows = lines.map((line, index) => ({
          Line: line,
          LineNumber: index + 1,
        }));

        cleanAndSetData(rows, file.name);
      } catch (error) {
        console.error("Text processing error:", error);
        setError("Failed to read the text file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the text file.");
      setIsProcessing(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  const processFile = (file) => {
    if (!file) return;

    setStatus({
      type: "",
      message: "",
    });

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
      );
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "";

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      setError(
        `Unsupported file type ".${extension || "unknown"}". Supported formats: CSV, Excel, JSON, and text files.`
      );
      return;
    }

    setIsProcessing(true);

    if (extension === "csv") {
      processCsv(file);
    } else if (extension === "xls" || extension === "xlsx") {
      processExcel(file);
    } else if (extension === "json") {
      processJson(file);
    } else {
      processText(file);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    processFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    processFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleSheetSelect = (sheetName) => {
    if (!workbookData?.workbook || !sheetName) {
      return;
    }

    setSelectedSheet(sheetName);
    setIsProcessing(true);

    processExcelSheet(
      workbookData.workbook,
      sheetName,
      workbookData.fileName,
      sheets.length > 1
    );

    setIsProcessing(false);
  };

  return (
    <section className="uploader" aria-label="Dataset uploader">
      <div className="uploader-compact-header">
        <div className="uploader-title-wrap">
          <div className="uploader-title-icon" aria-hidden="true">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>

          <div>
            <h2>Import data</h2>
            <p>Add a dataset to start exploring.</p>
          </div>
        </div>

        <button
          type="button"
          className="uploader-browse-button"
          onClick={handleBrowseClick}
          disabled={isProcessing}
        >
          {isProcessing ? "Working..." : "Browse"}
        </button>
      </div>

      <div
        className={`uploader-dropzone uploader-dropzone-compact ${
          isDragging ? "is-dragging" : ""
        } ${isProcessing ? "is-processing" : ""}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        onClick={handleBrowseClick}
        onKeyDown={(event) => {
          if (
            !isProcessing &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label="Upload dataset"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-input"
          className="uploader-input"
          accept=".csv,.xls,.xlsx,.json,.txt,.log"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />

        <div className="uploader-drop-icon" aria-hidden="true">
          <i
            className={`fa-solid ${
              isProcessing
                ? "fa-spinner fa-spin"
                : isDragging
                ? "fa-file-arrow-down"
                : "fa-cloud-arrow-up"
            }`}
          ></i>
        </div>

        <div className="uploader-drop-content">
          <strong>
            {isProcessing
              ? "Processing dataset"
              : isDragging
              ? "Drop file to import"
              : "Drop a file here"}
          </strong>

          <span>
            {isProcessing
              ? "Please wait..."
              : "or use the Browse button"}
          </span>
        </div>
      </div>

      <div className="uploader-meta">
        <span>
          <i className="fa-solid fa-file-lines"></i>
          CSV
        </span>

        <span>
          <i className="fa-solid fa-table"></i>
          Excel
        </span>

        <span>
          <i className="fa-solid fa-code"></i>
          JSON
        </span>

        <span className="uploader-size">
          Max {formatFileSize(MAX_FILE_SIZE)}
        </span>
      </div>

      {status.message && (
        <div
          className={`uploader-status uploader-status-${status.type}`}
          role={status.type === "error" ? "alert" : "status"}
        >
          <span className="uploader-status-icon" aria-hidden="true">
            {status.type === "error"
              ? "!"
              : status.type === "success"
              ? "✓"
              : "i"}
          </span>

          <span>{status.message}</span>
        </div>
      )}

      {sheets.length > 1 && (
        <div className="sheet-selector sheet-selector-compact">
          <div className="sheet-selector-heading">
            <div className="sheet-selector-title">
              <i className="fa-solid fa-table-cells"></i>

              <div>
                <strong>Workbook sheets</strong>
                <span>{workbookData?.fileName}</span>
              </div>
            </div>

            <span className="sheet-count">{sheets.length}</span>
          </div>

          <label htmlFor="sheet-select">Worksheet</label>

          <select
            id="sheet-select"
            value={selectedSheet}
            onChange={(event) => handleSheetSelect(event.target.value)}
            disabled={isProcessing}
          >
            {sheets.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>

          <p>Each selected sheet is imported as a separate dataset.</p>
        </div>
      )}
    </section>
  );
}

export default FileUploader;
