import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import "../App.css";

function FileUploader({ setDatasets }) {
  const [workbookData, setWorkbookData] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB limit

  const cleanAndSetData = (rawData, fileName) => {
    if (!rawData || rawData.length === 0) {
      alert("No data found in file!");
      return;
    }

    const cleanData = rawData.filter((row) =>
      Object.values(row).some(
        (val) => val !== "" && val !== null && val !== undefined
      )
    );

    const typedData = cleanData.map((row) => {
      const newRow = {};
      for (let key in row) {
        let value = row[key];
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed === "") value = null;
          else if (/^-?\d+(\.\d+)?$/.test(trimmed)) value = Number(trimmed);
          else if (["true", "false"].includes(trimmed.toLowerCase()))
            value = trimmed.toLowerCase() === "true";
          else value = trimmed;
        }
        newRow[key] = value;
      }
      return newRow;
    });

    setDatasets((prev) => {
      if (prev.some((d) => d.name === fileName)) {
        alert("This file has already been uploaded.");
        return prev;
      }
      const columns = Object.keys(typedData[0] || {});
      return [...prev, { name: fileName, data: typedData, columns }];
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = null; // allow re-upload
    if (!file) return;

    // ✅ File size check
    if (file.size > MAX_FILE_SIZE) {
      alert(
        `File is too large! Max allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
      );
      return;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();

    // CSV
    if (fileExtension === "csv") {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (result) => {
          if (!result.data || result.data.length === 0) {
            alert("Empty CSV file!");
            return;
          }
          const firstRow = result.data[0].map((h, i) =>
            h && String(h).trim() !== "" ? String(h).trim() : `Column_${i + 1}`
          );
          const rows = result.data.slice(1).map((row) => {
            const obj = {};
            firstRow.forEach((h, i) => (obj[h] = row[i]));
            return obj;
          });
          cleanAndSetData(rows, file.name);
        },
        error: (err) => {
          console.error("CSV Parsing error:", err);
          alert("Failed to parse CSV file.");
        },
      });
    }
    // Excel
    else if (["xls", "xlsx"].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
            raw: false,
          });

          if (!workbook.SheetNames.length) {
            alert("Excel file has no sheets!");
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false,
          });

          if (jsonData.length === 0) {
            alert("Excel sheet is empty!");
            return;
          }

          cleanAndSetData(jsonData, `${file.name} - ${firstSheetName}`);

          if (workbook.SheetNames.length > 1) {
            setWorkbookData({ workbook, fileName: file.name });
            setSheets(workbook.SheetNames);
            setSelectedSheet(firstSheetName);
          }
        } catch (err) {
          console.error("Excel parsing error:", err);
          alert("Failed to parse Excel file. It might be protected or corrupted.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Text-based files
    else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          if (!content || content.trim() === "") {
            alert("File contains no readable content!");
            return;
          }

          const lines = content.split(/\r?\n/);
          const rows = lines.map((line) => ({ Line: line }));
          cleanAndSetData(rows, file.name);
        } catch (err) {
          console.error("File reading error:", err);
          alert("Failed to read file.");
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleSheetSelect = (sheetName) => {
    if (!workbookData) return;
    const { workbook, fileName } = workbookData;
    setSelectedSheet(sheetName);

    try {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (jsonData.length === 0) {
        alert("Empty Excel sheet!");
        return;
      }

      const headers = jsonData[0].map((h, i) =>
        h ? String(h).trim() : `Column_${i + 1}`
      );
      const rows = jsonData.slice(1).map((row) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = row[i]));
        return obj;
      });

      cleanAndSetData(rows, `${fileName} - ${sheetName}`);
    } catch (err) {
      console.error("Error processing sheet:", err);
      alert("Failed to process selected sheet.");
    }
  };

  return (
    <div className="uploader">
      <label htmlFor="file-input">Upload File:</label>
      <input
        type="file"
        id="file-input"
        accept="*/*"
        onChange={handleFileUpload}
      />

      {sheets.length > 1 && (
        <div className="sheet-selector">
          <label>Select Sheet:</label>
          <select
            value={selectedSheet}
            onChange={(e) => handleSheetSelect(e.target.value)}
          >
            {sheets.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
