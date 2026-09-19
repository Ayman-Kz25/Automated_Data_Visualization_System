import { useEffect, useRef } from "react";
import * as d3 from "d3";


const MAX_LABEL_LENGTH = 28;

const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement);

  return {
    text: styles.getPropertyValue("--text").trim() || "#1f2937",
    muted: styles.getPropertyValue("--text-muted").trim() || "#6b7280",
    border: styles.getPropertyValue("--border").trim() || "#d1d5db",
    surface: styles.getPropertyValue("--surface").trim() || "#ffffff",
    primary: styles.getPropertyValue("--primary").trim() || "#6366f1",
  };
};

const truncateLabel = (value, maxLength = MAX_LABEL_LENGTH) => {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Missing";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const buildHierarchy = (rows, columns, depth = 0) => {
  if (!Array.isArray(rows) || rows.length === 0 || depth >= columns.length) {
    return [];
  }

  const column = columns[depth];

  const grouped = d3.group(rows, (row) => {
    const value = row?.[column];

    return value === null || value === undefined || value === ""
      ? "Missing"
      : String(value);
  });

  return Array.from(grouped, ([value, values]) => ({
    name: `${column}: ${value}`,
    column,
    value,
    children: buildHierarchy(values, columns, depth + 1),
  }));
};

const TreeChart = ({ data, layout = "vertical" }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const svgElement = svgRef.current;
    const containerElement = containerRef.current;

    if (!svgElement || !containerElement) {
      return undefined;
    }

    const svg = d3.select(svgElement);

    const render = () => {
      svg.selectAll("*").remove();

      if (!Array.isArray(data) || data.length === 0) {
        return;
      }

      const validRows = data.filter(
        (row) => row && typeof row === "object" && !Array.isArray(row)
      );

      if (validRows.length === 0) {
        return;
      }

      const columns = Object.keys(validRows[0]).filter(
        (column) => column.trim().length > 0
      );

      if (columns.length === 0) {
        return;
      }

      const width = Math.max(containerElement.clientWidth, 320);
      const height = Math.max(containerElement.clientHeight, 500);

      const colors = getThemeColors();

      const rootData = {
        name: "Dataset",
        column: "Root",
        children: buildHierarchy(validRows, columns),
      };

      const root = d3.hierarchy(rootData);

      const color = d3
        .scaleOrdinal()
        .domain(["Root", ...columns])
        .range([
          colors.primary,
          "#6366f1",
          "#8b5cf6",
          "#ec4899",
          "#f97316",
          "#eab308",
          "#10b981",
          "#06b6d4",
        ]);

      svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const chartGroup = svg.append("g").attr("class", "tree-chart-group");

      const tooltip = d3
        .select(containerElement)
        .selectAll(".tree-chart-tooltip")
        .data([null])
        .join("div")
        .attr("class", "tree-chart-tooltip")
        .style("opacity", 0)
        .style("pointer-events", "none");

      const highlightPath = (node) => {
        const relatedNodes = new Set();

        node.ancestors().forEach((ancestor) => {
          relatedNodes.add(ancestor);
        });

        node.descendants().forEach((descendant) => {
          relatedNodes.add(descendant);
        });

        chartGroup
          .selectAll(".tree-link")
          .style("opacity", (link) => {
            return relatedNodes.has(link.source) &&
              relatedNodes.has(link.target)
              ? 1
              : 0.12;
          });

        chartGroup
          .selectAll(".tree-node")
          .style("opacity", (treeNode) =>
            relatedNodes.has(treeNode) ? 1 : 0.2
          );
      };

      const clearHighlight = () => {
        chartGroup.selectAll(".tree-link").style("opacity", 0.55);
        chartGroup.selectAll(".tree-node").style("opacity", 1);
      };

      if (layout === "radial") {
        const radius = Math.max(
          Math.min(width, height) / 2 - 100,
          100
        );

        const treeLayout = d3
          .tree()
          .size([2 * Math.PI, radius])
          .separation((a, b) => {
            return a.parent === b.parent ? 1 : 1.8;
          });

        treeLayout(root);

        chartGroup.attr(
          "transform",
          `translate(${width / 2},${height / 2})`
        );

        const links = chartGroup
          .selectAll(".tree-link")
          .data(root.links())
          .join("path")
          .attr("class", "tree-link")
          .attr("fill", "none")
          .attr("stroke", colors.border)
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.7)
          .attr(
            "d",
            d3
              .linkRadial()
              .angle((d) => d.x)
              .radius((d) => d.y)
          );

        links
          .on("mouseenter", function () {
            d3.select(this)
              .attr("stroke", colors.primary)
              .attr("stroke-opacity", 1)
              .attr("stroke-width", 2.5);
          })
          .on("mouseleave", function () {
            d3.select(this)
              .attr("stroke", colors.border)
              .attr("stroke-opacity", 0.7)
              .attr("stroke-width", 1.5);
          });

        const nodes = chartGroup
          .selectAll(".tree-node")
          .data(root.descendants())
          .join("g")
          .attr("class", "tree-node")
          .attr(
            "transform",
            (d) =>
              `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
          )
          .style("cursor", "pointer");

        nodes
          .append("circle")
          .attr("class", "tree-node-circle")
          .attr("r", (d) => (d.children ? 5.5 : 4))
          .attr("fill", (d) => color(d.data.column))
          .attr("stroke", colors.surface)
          .attr("stroke-width", 2);

        nodes
          .append("text")
          .attr("class", "tree-node-label")
          .attr("dy", "0.32em")
          .attr("x", (d) => (d.x >= Math.PI ? -9 : 9))
          .attr("text-anchor", (d) => (d.x >= Math.PI ? "end" : "start"))
          .attr("fill", colors.text)
          .attr("font-size", (d) => (d.depth === 0 ? 12 : 10))
          .attr("font-weight", (d) => (d.depth === 0 ? 700 : 500))
          .attr("transform", (d) =>
            d.x >= Math.PI ? "rotate(180)" : null
          )
          .text((d) => truncateLabel(d.data.name));

        nodes
          .on("mouseenter", function (event, d) {
            highlightPath(d);

            d3.select(this)
              .select(".tree-node-circle")
              .transition()
              .duration(150)
              .attr("r", d.children ? 8 : 7);

            tooltip
              .style("opacity", 1)
              .html(
                `<strong>${d.data.column}</strong><br />${formatValue(
                  d.data.value
                )}<br /><span>${d.descendants().length} node${
                  d.descendants().length === 1 ? "" : "s"
                }</span>`
              )
              .style("left", `${event.offsetX + 14}px`)
              .style("top", `${event.offsetY + 14}px`);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.offsetX + 14}px`)
              .style("top", `${event.offsetY + 14}px`);
          })
          .on("mouseleave", function () {
            clearHighlight();

            d3.select(this)
              .select(".tree-node-circle")
              .transition()
              .duration(150)
              .attr("r", (d) => (d.children ? 5.5 : 4));

            tooltip.style("opacity", 0);
          });
      } else {
        const margin = {
          top: 60,
          right: 80,
          bottom: 60,
          left: 80,
        };

        const innerWidth = Math.max(width - margin.left - margin.right, 200);
        const innerHeight = Math.max(
          height - margin.top - margin.bottom,
          300
        );

        const treeLayout = d3
          .tree()
          .size([innerWidth, innerHeight])
          .separation((a, b) => {
            return a.parent === b.parent ? 1 : 1.5;
          });

        treeLayout(root);

        chartGroup.attr(
          "transform",
          `translate(${margin.left},${margin.top})`
        );

        const links = chartGroup
          .selectAll(".tree-link")
          .data(root.links())
          .join("path")
          .attr("class", "tree-link")
          .attr("fill", "none")
          .attr("stroke", colors.border)
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.7)
          .attr(
            "d",
            d3
              .linkVertical()
              .x((d) => d.x)
              .y((d) => d.y)
          );

        const nodes = chartGroup
          .selectAll(".tree-node")
          .data(root.descendants())
          .join("g")
          .attr("class", "tree-node")
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .style("cursor", "pointer");

        nodes
          .append("circle")
          .attr("class", "tree-node-circle")
          .attr("r", (d) => (d.children ? 6 : 4.5))
          .attr("fill", (d) => color(d.data.column))
          .attr("stroke", colors.surface)
          .attr("stroke-width", 2);

        nodes
          .append("text")
          .attr("class", "tree-node-label")
          .attr("dy", (d) => (d.children ? -11 : 17))
          .attr("text-anchor", "middle")
          .attr("fill", colors.text)
          .attr("font-size", (d) => (d.depth === 0 ? 12 : 10))
          .attr("font-weight", (d) => (d.depth === 0 ? 700 : 500))
          .text((d) => truncateLabel(d.data.name));

        nodes
          .on("mouseenter", function (event, d) {
            highlightPath(d);

            d3.select(this)
              .select(".tree-node-circle")
              .transition()
              .duration(150)
              .attr("r", d.children ? 9 : 7);

            tooltip
              .style("opacity", 1)
              .html(
                `<strong>${d.data.column}</strong><br />${formatValue(
                  d.data.value
                )}<br /><span>${d.descendants().length} node${
                  d.descendants().length === 1 ? "" : "s"
                }</span>`
              )
              .style("left", `${event.offsetX + 14}px`)
              .style("top", `${event.offsetY + 14}px`);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.offsetX + 14}px`)
              .style("top", `${event.offsetY + 14}px`);
          })
          .on("mouseleave", function () {
            clearHighlight();

            d3.select(this)
              .select(".tree-node-circle")
              .transition()
              .duration(150)
              .attr("r", (d) => (d.children ? 6 : 4.5));

            tooltip.style("opacity", 0);
          });

        links
          .on("mouseenter", function () {
            d3.select(this)
              .attr("stroke", colors.primary)
              .attr("stroke-opacity", 1)
              .attr("stroke-width", 2.5);
          })
          .on("mouseleave", function () {
            d3.select(this)
              .attr("stroke", colors.border)
              .attr("stroke-opacity", 0.7)
              .attr("stroke-width", 1.5);
          });
      }

      const zoom = d3
        .zoom()
        .scaleExtent([0.35, 3])
        .translateExtent([
          [-width, -height],
          [width * 2, height * 2],
        ])
        .on("zoom", (event) => {
          chartGroup.attr("transform", event.transform);
        });

      svg.call(zoom);

      const initialTransform =
        layout === "radial"
          ? d3.zoomIdentity
          : d3.zoomIdentity.translate(0, 0).scale(1);

      svg.call(zoom.transform, initialTransform);
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      render();
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
      d3.select(containerElement)
        .selectAll(".tree-chart-tooltip")
        .remove();
    };
  }, [data, layout]);

  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some(
      (row) => row && typeof row === "object" && !Array.isArray(row)
    );

  return (
    <div ref={containerRef} className="tree-chart-container">
      {!hasData && (
        <div className="tree-chart-empty">
          <div className="tree-chart-empty-icon">
            <i className="fa-solid fa-diagram-project" />
          </div>
          <strong>No hierarchy data available</strong>
          <span>Upload a dataset to generate the tree visualization.</span>
        </div>
      )}

      <svg
        ref={svgRef}
        className="tree-chart-svg"
        role="img"
        aria-label="Hierarchical tree visualization"
      />
    </div>
  );
};

export default TreeChart;