import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ReportExporter({
  chartRef,
  insightsRef,
  summaryRef,
  xCol,
  yCol,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState("");

  const handleDownloadPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setStatus("Preparing report...");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - margin - 14;

      let yOffset = 30;
      let pageNumber = 1;

      const colors = {
        primary: [37, 99, 235],
        primaryDark: [30, 64, 175],
        text: [31, 41, 55],
        muted: [107, 114, 128],
        border: [220, 224, 230],
        surface: [248, 250, 252],
        white: [255, 255, 255],
        success: [22, 163, 74],
        warning: [217, 119, 6],
        danger: [220, 38, 38],
      };

      const safeText = (value, fallback = "") => {
        if (value === null || value === undefined) {
          return fallback;
        }

        return String(value);
      };

      const addPageNumber = () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.muted);

        pdf.text(
          `Page ${pageNumber}`,
          pageWidth / 2,
          pageHeight - 7,
          {
            align: "center",
          }
        );
      };

      const drawPageFrame = () => {
        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(
          margin,
          margin,
          contentWidth,
          pageHeight - margin * 2,
          2,
          2
        );

        addPageNumber();
      };

      const addNewPage = () => {
        addPageNumber();

        pdf.addPage();

        pageNumber += 1;
        yOffset = 30;

        drawPageFrame();
      };

      const addSectionHeading = (
        title,
        subtitle = "",
        spacing = 12
      ) => {
        yOffset += spacing;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(17);
        pdf.setTextColor(...colors.primaryDark);

        pdf.text(
          safeText(title),
          margin + 6,
          yOffset
        );

        yOffset += 7;

        if (subtitle) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...colors.muted);

          const subtitleLines = pdf.splitTextToSize(
            safeText(subtitle),
            contentWidth - 12
          );

          pdf.text(
            subtitleLines,
            margin + 6,
            yOffset
          );

          yOffset += subtitleLines.length * 4.5;
        }

        yOffset += 4;

        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.6);

        pdf.line(
          margin + 6,
          yOffset,
          pageWidth - margin - 6,
          yOffset
        );

        yOffset += 9;
      };

      const captureElement = async (element) => {
        return html2canvas(element, {
          scale: Math.min(window.devicePixelRatio || 2, 2.5),
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
        });
      };

      const addCanvasImage = (
        canvas,
        maxWidth = contentWidth - 12,
        maxHeight = 0
      ) => {
        if (!canvas || !canvas.width || !canvas.height) {
          return 0;
        }

        const ratio = canvas.height / canvas.width;

        let imgWidth = Math.min(
          maxWidth,
          contentWidth - 12
        );

        let imgHeight = imgWidth * ratio;

        if (maxHeight > 0 && imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight / ratio;
        }

        const xPosition =
          margin + (contentWidth - imgWidth) / 2;

        pdf.addImage(
          canvas.toDataURL("image/png", 0.95),
          "PNG",
          xPosition,
          yOffset,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        yOffset += imgHeight;

        return imgHeight;
      };

      const addCoverPage = () => {
        pdf.setFillColor(...colors.white);
        pdf.rect(
          0,
          0,
          pageWidth,
          pageHeight,
          "F"
        );

        pdf.setDrawColor(...colors.primaryDark);
        pdf.setLineWidth(1.2);

        pdf.roundedRect(
          margin,
          margin,
          contentWidth,
          pageHeight - margin * 2,
          3,
          3
        );

        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.5);

        pdf.roundedRect(
          margin + 5,
          margin + 5,
          contentWidth - 10,
          pageHeight - margin * 2 - 10,
          2,
          2
        );

        pdf.setFillColor(...colors.primary);
        pdf.circle(
          pageWidth / 2,
          62,
          15,
          "F"
        );

        pdf.setTextColor(...colors.white);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(17);

        pdf.text(
          "DV",
          pageWidth / 2,
          67,
          {
            align: "center",
          }
        );

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(23);
        pdf.setTextColor(...colors.primaryDark);

        const titleLines = pdf.splitTextToSize(
          "Automated Data Visualization System",
          contentWidth - 35
        );

        pdf.text(
          titleLines,
          pageWidth / 2,
          103,
          {
            align: "center",
          }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(14);
        pdf.setTextColor(...colors.text);

        pdf.text(
          "Data Analysis Report",
          pageWidth / 2,
          126,
          {
            align: "center",
          }
        );

        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.5);

        pdf.line(
          pageWidth / 2 - 35,
          137,
          pageWidth / 2 + 35,
          137
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.muted);

        pdf.text(
          `X Column: ${safeText(xCol, "Not selected")}`,
          pageWidth / 2,
          155,
          {
            align: "center",
          }
        );

        pdf.text(
          `Y Column: ${safeText(yCol, "Not selected")}`,
          pageWidth / 2,
          164,
          {
            align: "center",
          }
        );

        pdf.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          173,
          {
            align: "center",
          }
        );

        pdf.setFillColor(...colors.surface);

        pdf.roundedRect(
          margin + 25,
          198,
          contentWidth - 50,
          34,
          3,
          3,
          "F"
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.text);

        const description =
          "This report contains generated visualizations, dataset profiling statistics, and automated analytical insights.";

        const descriptionLines =
          pdf.splitTextToSize(
            description,
            contentWidth - 65
          );

        pdf.text(
          descriptionLines,
          pageWidth / 2,
          212,
          {
            align: "center",
          }
        );

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.primary);

        pdf.text(
          "AUTOMATED DATA ANALYSIS",
          pageWidth / 2,
          255,
          {
            align: "center",
          }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.muted);

        pdf.text(
          "Generated from the currently loaded dashboard data",
          pageWidth / 2,
          263,
          {
            align: "center",
          }
        );

        addPageNumber();
      };

      const addChartToPdf = async (
        chartElement,
        index,
        totalCharts
      ) => {
        setStatus(
          `Exporting chart ${index + 1} of ${totalCharts}...`
        );

        const canvas = await captureElement(chartElement);

        if (!canvas) return;

        const maxChartHeight = 92;
        const ratio = canvas.height / canvas.width;

        let imgWidth = contentWidth - 16;
        let imgHeight = imgWidth * ratio;

        if (imgHeight > maxChartHeight) {
          imgHeight = maxChartHeight;
          imgWidth = imgHeight / ratio;
        }

        const blockHeight = imgHeight + 18;

        if (yOffset + blockHeight > bottomLimit) {
          addNewPage();
          addSectionHeading(
            "Generated Charts",
            "Continuation of the visualization section.",
            0
          );
        }

        const xPosition =
          margin + (contentWidth - imgWidth) / 2;

        pdf.setFillColor(...colors.surface);
        pdf.roundedRect(
          margin + 4,
          yOffset - 3,
          contentWidth - 8,
          imgHeight + 11,
          2,
          2,
          "F"
        );

        pdf.addImage(
          canvas.toDataURL("image/png", 0.95),
          "PNG",
          xPosition,
          yOffset,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        yOffset += imgHeight + 7;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...colors.text);

        pdf.text(
          `Chart ${index + 1}`,
          margin + 8,
          yOffset
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.muted);

        pdf.text(
          `${safeText(xCol, "X")} vs ${safeText(yCol, "Y")}`,
          margin + 8,
          yOffset + 4.5
        );

        yOffset += 12;
      };

      const addSummaryToPdf = async () => {
        if (!summaryRef?.current) return;

        setStatus("Exporting dataset summary...");

        addNewPage();

        addSectionHeading(
          "Dataset Summary",
          "Column-level statistics and data quality information.",
          0
        );

        const summaryElement =
          summaryRef.current;

        const summaryCanvas =
          await captureElement(summaryElement);

        if (!summaryCanvas) return;

        const imageRatio =
          summaryCanvas.height /
          summaryCanvas.width;

        let imgWidth = contentWidth - 12;
        let imgHeight = imgWidth * imageRatio;

        const maxHeight =
          pageHeight - yOffset - margin - 22;

        if (imgHeight <= maxHeight) {
          addCanvasImage(
            summaryCanvas,
            imgWidth,
            maxHeight
          );

          yOffset += 10;
          return;
        }

        const scaleFactor =
          maxHeight / imgHeight;

        imgHeight = maxHeight;
        imgWidth *= scaleFactor;

        const xPosition =
          margin + (contentWidth - imgWidth) / 2;

        pdf.addImage(
          summaryCanvas.toDataURL("image/png", 0.95),
          "PNG",
          xPosition,
          yOffset,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        yOffset += imgHeight + 10;
      };

      const addInsightsToPdf = () => {
        if (!insightsRef?.current) return;

        setStatus("Exporting generated insights...");

        const insightNodes =
          insightsRef.current.querySelectorAll(
            ".insight-card"
          );

        const fallbackNodes =
          insightNodes.length > 0
            ? Array.from(insightNodes)
            : Array.from(
                insightsRef.current.querySelectorAll("li")
              );

        if (fallbackNodes.length === 0) {
          return;
        }

        addNewPage();

        addSectionHeading(
          "Generated Insights",
          "Automatically calculated observations from the selected dataset.",
          0
        );

        fallbackNodes.forEach((node, index) => {
          const title =
            node.querySelector("h3")?.innerText ||
            `Insight ${index + 1}`;

          const text =
            node.querySelector("p")?.innerText ||
            node.innerText ||
            "";

          const metric =
            node.querySelector(".insight-metric")
              ?.innerText || "";

          const cleanTitle =
            safeText(title).trim();

          const cleanText =
            safeText(text).trim();

          const cleanMetric =
            safeText(metric).trim();

          const textLines =
            pdf.splitTextToSize(
              cleanText,
              contentWidth - 30
            );

          const cardHeight =
            16 + textLines.length * 4.2;

          if (
            yOffset + cardHeight >
            bottomLimit
          ) {
            addNewPage();

            addSectionHeading(
              "Generated Insights",
              "Continuation of the insights section.",
              0
            );
          }

          pdf.setFillColor(...colors.surface);

          pdf.roundedRect(
            margin + 4,
            yOffset,
            contentWidth - 8,
            cardHeight,
            2,
            2,
            "F"
          );

          pdf.setFillColor(...colors.primary);

          pdf.roundedRect(
            margin + 4,
            yOffset,
            2.5,
            cardHeight,
            1,
            1,
            "F"
          );

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(...colors.text);

          pdf.text(
            cleanTitle,
            margin + 12,
            yOffset + 7
          );

          if (cleanMetric) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...colors.primary);

            pdf.text(
              cleanMetric,
              pageWidth - margin - 10,
              yOffset + 7,
              {
                align: "right",
              }
            );
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.muted);

          pdf.text(
            textLines,
            margin + 12,
            yOffset + 12
          );

          yOffset += cardHeight + 6;
        });
      };

      addCoverPage();

      if (chartRef?.current) {
        const chartNodes = Array.from(
          chartRef.current.querySelectorAll(
            ".echarts-for-react"
          )
        );

        const alternativeChartNodes =
          chartNodes.length > 0
            ? chartNodes
            : Array.from(
                chartRef.current.querySelectorAll(
                  "[data-chart-export]"
                )
              );

        if (alternativeChartNodes.length > 0) {
          addNewPage();

          addSectionHeading(
            "Generated Charts",
            "Visualizations generated from the selected dataset.",
            0
          );

          for (
            let index = 0;
            index < alternativeChartNodes.length;
            index += 1
          ) {
            await addChartToPdf(
              alternativeChartNodes[index],
              index,
              alternativeChartNodes.length
            );
          }
        }
      }

      if (summaryRef?.current) {
        await addSummaryToPdf();
      }

      if (insightsRef?.current) {
        addInsightsToPdf();
      }

      addPageNumber();

      setStatus("Finalizing PDF...");

      const timestamp = new Date()
        .toISOString()
        .slice(0, 10);

      pdf.save(
        `Data_Visualization_Report_${timestamp}.pdf`
      );

      setStatus("Report downloaded successfully.");

      window.setTimeout(() => {
        setStatus("");
      }, 3500);
    } catch (error) {
      console.error(
        "PDF export error:",
        error
      );

      setStatus(
        "Failed to generate the PDF report."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-exporter">
      <button
        type="button"
        className="report-export-button"
        onClick={handleDownloadPDF}
        disabled={isExporting}
      >
        <i
          className={`fa-solid ${
            isExporting
              ? "fa-spinner fa-spin"
              : "fa-file-pdf"
          }`}
          aria-hidden="true"
        />

        <span>
          {isExporting
            ? "Generating Report..."
            : "Download PDF Report"}
        </span>
      </button>

      {status && (
        <div
          className={`report-export-status ${
            status.includes("successfully")
              ? "report-export-success"
              : status.includes("Failed")
              ? "report-export-error"
              : ""
          }`}
          role="status"
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default ReportExporter;
