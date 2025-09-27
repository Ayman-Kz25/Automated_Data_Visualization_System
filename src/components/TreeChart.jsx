import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const TreeChart = ({ data, layout = "vertical" }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 🔹 Get dataset columns
    const columns = Object.keys(data[0]);

    // 🔹 Recursive function to build hierarchy
    function buildHierarchy(data, columns, depth = 0) {
      if (depth >= columns.length) return [];
      const col = columns[depth];
      const grouped = d3.group(data, (d) => d[col]);

      return Array.from(grouped, ([key, values]) => ({
        name: `${col}: ${key}`,
        column: col, // keep track of which column
        children: buildHierarchy(values, columns, depth + 1),
      }));
    }

    const rootData = {
      name: "Root",
      column: "Root",
      children: buildHierarchy(data, columns),
    };

    const root = d3.hierarchy(rootData);

    if (layout === "radial") {
      // 🌐 Radial tree
      const radius = Math.min(width, height) / 2 - 80;
      const treeLayout = d3.tree().size([2 * Math.PI, radius]);
      treeLayout(root);

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Links
      g.selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr(
          "d",
          d3
            .linkRadial()
            .angle((d) => d.x)
            .radius((d) => d.y)
        );

      // Nodes
      g.selectAll(".node")
        .data(root.descendants())
        .join("circle")
        .attr("r", 4)
        .attr("fill", (d) => color(d.data.column))
        .attr(
          "transform",
          (d) =>
            `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
        );

      // Labels
      g.selectAll(".label")
        .data(root.descendants())
        .join("text")
        .attr("dy", "0.31em")
        .attr(
          "transform",
          (d) =>
            `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y + 6},0) rotate(${d.x >= Math.PI ? 180 : 0})`
        )
        .attr("text-anchor", (d) => (d.x >= Math.PI ? "end" : "start"))
        .style("font-size", "10px")
        .text((d) => d.data.name.length > 20 ? d.data.name.slice(0, 20) + "…" : d.data.name); // truncate long
    } else {
      // 📊 Vertical tree
      const treeLayout = d3.tree().size([width - 100, height - 100]);
      treeLayout(root);

      const g = svg.append("g").attr("transform", `translate(50,50)`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      g.selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr(
          "d",
          d3
            .linkVertical()
            .x((d) => d.x)
            .y((d) => d.y)
        );

      g.selectAll(".node")
        .data(root.descendants())
        .join("circle")
        .attr("r", 5)
        .attr("fill", (d) => color(d.data.column))
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      g.selectAll(".label")
        .data(root.descendants())
        .join("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text((d) => d.data.name);
    }

    // Zoom + Pan
    svg.call(
      d3.zoom().on("zoom", (event) => {
        svg.select("g").attr("transform", event.transform);
      })
    );
  }, [data, layout]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="700"
      style={{ border: "1px solid #ddd" }}
    />
  );
};

export default TreeChart;
