import { useMemo } from "react";
import * as d3 from "d3";

function isMissing(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function isNumeric(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const cleaned = value.replace(/[$,%]/g, "").replace(/,/g, "");
    return Number.isFinite(Number(cleaned));
  }

  return false;
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%]/g, "").replace(/,/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : null;
  }

  return null;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function correlation(x, y) {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    return 0;
  }

  const meanX = d3.mean(x);
  const meanY = d3.mean(y);

  if (!Number.isFinite(meanX) || !Number.isFinite(meanY)) {
    return 0;
  }

  const numerator = d3.sum(
    x.map((value, index) => {
      return (value - meanX) * (y[index] - meanY);
    })
  );

  const denominator = Math.sqrt(
    d3.sum(x.map((value) => Math.pow(value - meanX, 2))) *
      d3.sum(y.map((value) => Math.pow(value - meanY, 2)))
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

function skewness(values) {
  if (values.length < 3) return 0;

  const mean = d3.mean(values);
  const deviation = d3.deviation(values);
  const n = values.length;

  if (!Number.isFinite(deviation) || deviation === 0) {
    return 0;
  }

  return (
    (n / ((n - 1) * (n - 2))) *
    d3.sum(
      values.map((value) =>
        Math.pow((value - mean) / deviation, 3)
      )
    )
  );
}

function getTrend(values) {
  if (values.length < 2) {
    return null;
  }

  const xValues = values.map((_, index) => index);
  const yValues = values.map((value) => value);

  const meanX = d3.mean(xValues);
  const meanY = d3.mean(yValues);

  const denominator = d3.sum(
    xValues.map((x) => Math.pow(x - meanX, 2))
  );

  if (denominator === 0) {
    return null;
  }

  const slope =
    d3.sum(
      xValues.map(
        (x, index) => (x - meanX) * (yValues[index] - meanY)
      )
    ) / denominator;

  const intercept = meanY - slope * meanX;

  const predicted = xValues.map((x) => intercept + slope * x);

  const r = correlation(yValues, predicted);

  return {
    slope,
    rSquared: r * r,
  };
}

function isDateLike(value) {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    return false;
  }

  const timestamp = Date.parse(value);

  return !Number.isNaN(timestamp);
}

function getRelationshipLabel(corr) {
  const absolute = Math.abs(corr);

  if (absolute >= 0.9) return "very strong";
  if (absolute >= 0.7) return "strong";
  if (absolute >= 0.5) return "moderate";
  if (absolute >= 0.3) return "weak";

  return "very weak";
}

function InsightIcon({ icon }) {
  return (
    <span className="insight-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
  );
}

function InsightsPanel({ data, xCol, yCol }) {
  const insights = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0 || !xCol || !yCol) {
      return [];
    }

    const result = [];
    const columns = Object.keys(data[0] || {});

    if (!columns.includes(xCol) || !columns.includes(yCol)) {
      return [];
    }

    const numericPairs = data
      .map((row) => ({
        row,
        x: toNumber(row?.[xCol]),
        y: toNumber(row?.[yCol]),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.x) &&
          Number.isFinite(item.y)
      );

    const xValues = numericPairs.map((item) => item.x);
    const yValues = numericPairs.map((item) => item.y);

    const xIsNumeric = numericPairs.length > 0;

    const xIsCategory = data.some(
      (row) =>
        !isMissing(row?.[xCol]) &&
        !isNumeric(row?.[xCol])
    );

    const yIsNumeric = data.some(
      (row) =>
        !isMissing(row?.[yCol]) &&
        isNumeric(row?.[yCol])
    );

    const missingX = data.filter((row) =>
      isMissing(row?.[xCol])
    ).length;

    const missingY = data.filter((row) =>
      isMissing(row?.[yCol])
    ).length;

    result.push({
      type: "info",
      icon: "fa-database",
      title: "Analysis sample",
      text: `${numericPairs.length.toLocaleString()} paired observation${
        numericPairs.length === 1 ? "" : "s"
      } available for ${xCol} and ${yCol}.`,
    });

    if (xIsNumeric && yIsNumeric && numericPairs.length >= 2) {
      const corr = correlation(xValues, yValues);
      const relationship = getRelationshipLabel(corr);

      let direction = "positive";

      if (corr < 0) {
        direction = "negative";
      }

      if (Math.abs(corr) < 0.3) {
        result.push({
          type: "neutral",
          icon: "fa-link",
          title: "Weak relationship",
          text: `The linear relationship between ${xCol} and ${yCol} is very weak (r = ${formatNumber(
            corr
          )}).`,
          metric: `r ${formatNumber(corr)}`,
        });
      } else {
        result.push({
          type: corr >= 0 ? "positive" : "negative",
          icon: "fa-link",
          title: `${relationship} ${direction} correlation`,
          text: `${xCol} and ${yCol} have a ${relationship} ${direction} linear relationship (r = ${formatNumber(
            corr
          )}).`,
          metric: `r ${formatNumber(corr)}`,
        });
      }
    }

    if (xIsCategory) {
      const categoryCounts = d3.rollups(
        data.filter((row) => !isMissing(row?.[xCol])),
        (values) => values.length,
        (row) => String(row[xCol])
      );

      categoryCounts.sort((a, b) => b[1] - a[1]);

      const topCategory = categoryCounts[0];

      if (topCategory) {
        const share =
          data.length > 0
            ? (topCategory[1] / data.length) * 100
            : 0;

        result.push({
          type: "warning",
          icon: "fa-ranking-star",
          title: "Category concentration",
          text: `${topCategory[0]} is the most frequent ${xCol} category with ${topCategory[1].toLocaleString()} observations (${formatNumber(
            share,
            1
          )}% of the dataset).`,
          metric: `${formatNumber(share, 1)}%`,
        });
      }

      if (categoryCounts.length > 1) {
        result.push({
          type: "info",
          icon: "fa-layer-group",
          title: "Category coverage",
          text: `${xCol} contains ${categoryCounts.length.toLocaleString()} distinct categories.`,
          metric: categoryCounts.length.toLocaleString(),
        });
      }
    }

    if (yIsNumeric && numericPairs.length > 0) {
      const maxRow = d3.greatest(
        numericPairs,
        (item) => item.y
      );

      const minRow = d3.least(
        numericPairs,
        (item) => item.y
      );

      if (maxRow) {
        result.push({
          type: "positive",
          icon: "fa-arrow-up",
          title: `Highest ${yCol}`,
          text: `${yCol} reaches ${formatNumber(
            maxRow.y
          )} at ${xCol} = ${String(maxRow.row[xCol])}.`,
          metric: formatNumber(maxRow.y),
        });
      }

      if (minRow) {
        result.push({
          type: "neutral",
          icon: "fa-arrow-down",
          title: `Lowest ${yCol}`,
          text: `${yCol} reaches ${formatNumber(
            minRow.y
          )} at ${xCol} = ${String(minRow.row[xCol])}.`,
          metric: formatNumber(minRow.y),
        });
      }
    }

    if (yValues.length >= 2) {
      const mean = d3.mean(yValues);
      const median = d3.median(yValues);
      const std = d3.deviation(yValues) || 0;

      const min = d3.min(yValues);
      const max = d3.max(yValues);

      const sortedValues = yValues.slice().sort(d3.ascending);

      const q1 = d3.quantile(sortedValues, 0.25);
      const q3 = d3.quantile(sortedValues, 0.75);

      const range = max - min;

      const coefficientOfVariation =
        mean !== 0 ? Math.abs(std / mean) * 100 : 0;

      result.push({
        type: "info",
        icon: "fa-chart-area",
        title: `${yCol} variability`,
        text: `The standard deviation is ${formatNumber(
          std
        )}, with a range of ${formatNumber(range)}.`,
        metric: `σ ${formatNumber(std)}`,
      });

      result.push({
        type: "info",
        icon: "fa-scale-balanced",
        title: "Central tendency",
        text: `The mean is ${formatNumber(
          mean
        )}, while the median is ${formatNumber(median)}.`,
        metric: `μ ${formatNumber(mean)}`,
      });

      if (q1 !== undefined && q3 !== undefined) {
        result.push({
          type: "info",
          icon: "fa-arrows-left-right",
          title: "Interquartile range",
          text: `The middle 50% of ${yCol} falls between ${formatNumber(
            q1
          )} and ${formatNumber(q3)}.`,
          metric: `IQR ${formatNumber(q3 - q1)}`,
        });
      }

      if (Number.isFinite(coefficientOfVariation)) {
        result.push({
          type: "neutral",
          icon: "fa-percent",
          title: "Relative variability",
          text: `${yCol} has a coefficient of variation of ${formatNumber(
            coefficientOfVariation,
            1
          )}%.`,
          metric: `${formatNumber(
            coefficientOfVariation,
            1
          )}%`,
        });
      }

      const skew = skewness(yValues);

      if (skew > 1) {
        result.push({
          type: "warning",
          icon: "fa-arrow-trend-up",
          title: "Positive skew",
          text: `${yCol} has a positively skewed distribution (skewness ${formatNumber(
            skew
          )}), indicating a longer upper tail.`,
          metric: formatNumber(skew),
        });
      } else if (skew < -1) {
        result.push({
          type: "warning",
          icon: "fa-arrow-trend-down",
          title: "Negative skew",
          text: `${yCol} has a negatively skewed distribution (skewness ${formatNumber(
            skew
          )}), indicating a longer lower tail.`,
          metric: formatNumber(skew),
        });
      } else {
        result.push({
          type: "neutral",
          icon: "fa-arrows-left-right",
          title: "Balanced distribution",
          text: `${yCol} has relatively limited skewness (skewness ${formatNumber(
            skew
          )}).`,
          metric: formatNumber(skew),
        });
      }

      if (q1 !== undefined && q3 !== undefined) {
        const iqr = q3 - q1;

        if (iqr > 0) {
          const lowerFence = q1 - 1.5 * iqr;
          const upperFence = q3 + 1.5 * iqr;

          const outliers = numericPairs.filter(
            (item) =>
              item.y < lowerFence || item.y > upperFence
          );

          if (outliers.length > 0) {
            const percentage =
              (outliers.length / yValues.length) * 100;

            result.push({
              type: "warning",
              icon: "fa-triangle-exclamation",
              title: "Potential outliers",
              text: `${outliers.length.toLocaleString()} value${
                outliers.length === 1 ? "" : "s"
              } in ${yCol} fall outside the 1.5×IQR fences (${formatNumber(
                percentage,
                1
              )}% of observations).`,
              metric: outliers.length.toLocaleString(),
            });
          } else {
            result.push({
              type: "positive",
              icon: "fa-circle-check",
              title: "No IQR outliers",
              text: `No ${yCol} values fall outside the standard 1.5×IQR outlier fences.`,
              metric: "0",
            });
          }
        }
      }
    }

    if (
      xIsCategory &&
      yIsNumeric &&
      numericPairs.length > 0
    ) {
      const grouped = d3.rollups(
        numericPairs,
        (values) => ({
          mean: d3.mean(values, (item) => item.y),
          count: values.length,
        }),
        (item) => String(item.row[xCol])
      );

      grouped.sort((a, b) => b[1].mean - a[1].mean);

      if (grouped.length > 1) {
        const highest = grouped[0];
        const lowest = grouped[grouped.length - 1];

        result.push({
          type: "positive",
          icon: "fa-chart-column",
          title: "Category comparison",
          text: `${highest[0]} has the highest average ${yCol} (${formatNumber(
            highest[1].mean
          )}), while ${lowest[0]} has the lowest (${formatNumber(
            lowest[1].mean
          )}).`,
          metric: `${grouped.length} groups`,
        });
      }
    }

    const datePairs = data
      .map((row) => {
        const rawDate = row?.[xCol];

        if (!isDateLike(rawDate)) {
          return null;
        }

        const date = new Date(rawDate);
        const value = toNumber(row?.[yCol]);

        if (
          Number.isNaN(date.getTime()) ||
          !Number.isFinite(value)
        ) {
          return null;
        }

        return {
          date,
          value,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);

    if (datePairs.length >= 3) {
      const trend = getTrend(
        datePairs.map((item) => item.value)
      );

      if (trend) {
        if (trend.slope > 0) {
          result.push({
            type: "positive",
            icon: "fa-chart-line",
            title: "Upward time trend",
            text: `${yCol} generally increases over ${xCol}, based on the fitted linear trend.`,
            metric: `R² ${formatNumber(trend.rSquared)}`,
          });
        } else if (trend.slope < 0) {
          result.push({
            type: "negative",
            icon: "fa-chart-line",
            title: "Downward time trend",
            text: `${yCol} generally decreases over ${xCol}, based on the fitted linear trend.`,
            metric: `R² ${formatNumber(trend.rSquared)}`,
          });
        } else {
          result.push({
            type: "neutral",
            icon: "fa-chart-line",
            title: "Stable time trend",
            text: `No meaningful linear direction was detected for ${yCol} over ${xCol}.`,
            metric: `R² ${formatNumber(trend.rSquared)}`,
          });
        }
      }
    }

    const missingByColumn = columns
      .map((column) => {
        const missingCount = data.filter((row) =>
          isMissing(row?.[column])
        ).length;

        return {
          column,
          missingCount,
          percentage:
            data.length > 0
              ? (missingCount / data.length) * 100
              : 0,
        };
      })
      .filter((item) => item.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount);

    if (missingByColumn.length > 0) {
      const highestMissing = missingByColumn[0];

      result.push({
        type: "warning",
        icon: "fa-ban",
        title: "Missing data detected",
        text: `${highestMissing.column} contains ${highestMissing.missingCount.toLocaleString()} missing value${
          highestMissing.missingCount === 1 ? "" : "s"
        } (${formatNumber(
          highestMissing.percentage,
          1
        )}%).`,
        metric: `${formatNumber(
          highestMissing.percentage,
          1
        )}%`,
      });
    } else {
      result.push({
        type: "positive",
        icon: "fa-circle-check",
        title: "Complete dataset",
        text: "No missing values were detected across the dataset.",
        metric: "100%",
      });
    }

    if (missingX > 0 || missingY > 0) {
      result.push({
        type: "warning",
        icon: "fa-filter-circle-xmark",
        title: "Analysis exclusions",
        text: `${missingX + missingY} missing X/Y values may have been excluded from pair-based analysis.`,
        metric: `${numericPairs.length}/${data.length}`,
      });
    }

    return result;
  }, [data, xCol, yCol]);

  return (
    <section className="insights-panel" aria-label="Data insights">
      <div className="insights-header">
        <div className="insights-header-content">
          <span className="insights-eyebrow">
            AUTOMATED ANALYSIS
          </span>

          <h2>Insights Report</h2>

          <p>
            Statistical observations generated from{" "}
            <strong title={xCol || "X"}>{xCol || "X"}</strong>
            {" and "}
            <strong title={yCol || "Y"}>{yCol || "Y"}</strong>.
          </p>
        </div>

        <div className="insights-header-icon" aria-hidden="true">
          <i className="fa-solid fa-wand-magic-sparkles" />
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <article
              className={`insight-card insight-${insight.type}`}
              key={`${insight.title}-${index}`}
            >
              <InsightIcon icon={insight.icon} />

              <div className="insight-content">
                <div className="insight-title-row">
                  <h3 title={insight.title}>
                    {insight.title}
                  </h3>

                  {insight.metric && (
                    <span
                      className="insight-metric"
                      title={insight.metric}
                    >
                      {insight.metric}
                    </span>
                  )}
                </div>

                <p>{insight.text}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="insights-empty">
          <div className="insights-empty-icon" aria-hidden="true">
            <i className="fa-solid fa-chart-simple" />
          </div>

          <h3>No insights available</h3>

          <p>
            Select valid X and Y columns with enough usable data to
            generate statistical insights.
          </p>
        </div>
      )}

      {insights.length > 0 && (
        <footer className="insights-footer">
          <i
            className="fa-solid fa-circle-info"
            aria-hidden="true"
          />

          <span>
            Insights are calculated automatically from the currently
            selected dataset and columns.
          </span>
        </footer>
      )}
    </section>
  );
}

export default InsightsPanel;
