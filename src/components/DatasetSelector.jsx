function DatasetSelector({
  datasets,
  activeDataset,
  setActiveDataset,
}) {

  /* NORMALIZE DATASETS */
  const availableDatasets = Array.isArray(datasets)
    ? datasets.filter(
        (dataset) =>
          dataset &&
          typeof dataset === "object"
      )
    : [];

  /* HANDLE DATASET CHANGE */
  const handleDatasetChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setActiveDataset(null);
      return;
    }

    const index = Number(value);

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < availableDatasets.length
    ) {
      setActiveDataset(index);
    }
  };

  /* RENDER */
  return (
    <div className="dataset-selector">
      <label htmlFor="dataset">
        Select Dataset:
      </label>

      <select
        id="dataset"
        name="dataset"
        value={activeDataset ?? ""}
        onChange={handleDatasetChange}
        disabled={availableDatasets.length === 0}
      >
        <option value="">
          {availableDatasets.length === 0
            ? "--No datasets--"
            : "--Choose--"}
        </option>

        {availableDatasets.map((dataset, index) => (
          <option
            key={`${dataset.name || "dataset"}-${index}`}
            value={index}
          >
            {dataset.name || `Dataset ${index + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DatasetSelector;
