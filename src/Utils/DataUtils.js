/**
 * Detect column types: categorical or numerical
 * @param {Array} data - array of objects
 * @returns {Object} - { columnName: "categorical"|"numerical" }
 */
export function detectColumnTypes(data) {
  const types = {};
  if (!data || data.length === 0) return types;

  Object.keys(data[0]).forEach((col) => {
    const sample = data[0][col];
    types[col] = typeof sample === "number" ? "numerical" : "categorical";
  });

  return types;
}

/**
 * Suggest charts based on x and y column types
 * @param {string} xType - "categorical" or "numerical"
 * @param {string} yType - "categorical" or "numerical"
 * @returns {string[]} - array of suggested chart types (up to 3)
 */
export function suggestCharts(xType, yType) {
  let suggestions = [];

  if (xType === "numerical" && yType === "numerical") {
    suggestions = ["scatter", "line", "radar"];
  } else if (xType === "categorical" && yType === "numerical") {
    suggestions = ["bar", "area", "radar"];
  } else if (xType === "numerical" && yType === "categorical") {
    suggestions = ["bar", "pie"];
  } else if (xType === "categorical" && yType === "categorical") {
    suggestions = ["bar", "pie", "treemap"];
  } else {
    suggestions = ["line", "bar", "funnel"];
  }

  return suggestions.slice(0, 3); // return up to 3 suggestions
}
