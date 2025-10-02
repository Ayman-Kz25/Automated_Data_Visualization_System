import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../App.css";

function ReportExporter({ chartRef, insightsRef, summaryRef, xCol, yCol }) {
  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 12;
    let yOffset = 30;

    // --- Cover Page ---
    const borderColor = [25, 25, 112];
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(1.5);
    pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    pdf.setLineWidth(0.8);
    pdf.rect(
      margin + 4,
      margin + 4,
      pageWidth - 2 * (margin + 4),
      pageHeight - 2 * (margin + 4)
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(26);
    pdf.setTextColor(25, 25, 112);
    pdf.text("Automated Data Visualization System", pageWidth / 2, 100, {
      align: "center",
    });

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(20);
    pdf.setTextColor(70, 70, 70);
    pdf.text("AI-Generated Report", pageWidth / 2, 120, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(90, 90, 90);
    pdf.text("Prepared By: Ayman Kz", pageWidth / 2, 160, {
      align: "center",
    });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 175, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "This report includes automatically generated charts, dataset summary, and AI-driven insights.",
      pageWidth / 2,
      200,
      { align: "center", maxWidth: 180 }
    );

    // --- Helpers ---
    const addNewPageWithBorder = () => {
      pdf.addPage();
      yOffset = 30;
      pdf.setDrawColor(160, 160, 160);
      pdf.setLineWidth(0.8);
      pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    };

    const addHeading = (title, extraMargin = 15) => {
      yOffset += extraMargin;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(30, 144, 255);
      pdf.text(title, margin + 8, yOffset);
      yOffset += 8;
      pdf.setDrawColor(30, 144, 255);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 8, yOffset, pageWidth - margin - 8, yOffset);
      yOffset += 12;
    };

    addNewPageWithBorder();

    // --- Charts Section ---
    if (chartRef.current) {
      addHeading("Generated Charts");

      const chartNodes = chartRef.current.querySelectorAll(".recharts-wrapper");
      const chartsToExport = Array.from(chartNodes);

      for (let i = 0; i < chartsToExport.length; i++) {
        if (i % 3 === 0 && i !== 0) {
          addNewPageWithBorder();
          addHeading("Generated Charts (cont.)", 0);
        }

        const canvas = await html2canvas(chartsToExport[i], { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 2 * margin - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Ensure chart fits or go to next page
        if (yOffset + imgHeight > pageHeight - margin - 40) {
          addNewPageWithBorder();
          addHeading("Generated Charts (cont.)", 0);
        }

        pdf.addImage(imgData, "PNG", margin + 10, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 14;

        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `Chart ${i + 1}: ${xCol || "X"} vs ${yCol || "Y"}`,
          margin + 12,
          Math.min(yOffset, pageHeight - margin - 10)
        );
        yOffset += 10;
      }
    }

    // --- Dataset Summary Section ---
    if (summaryRef?.current) {
      const summaryCanvas = await html2canvas(summaryRef.current, { scale: 2 });
      const imgData = summaryCanvas.toDataURL("image/png");

      const imgWidth = pageWidth - 2 * margin - 20;
      const imgHeight = (summaryCanvas.height * imgWidth) / summaryCanvas.width;

      if (yOffset + imgHeight > pageHeight - margin - 40) {
        addNewPageWithBorder();
      }
      addHeading("Dataset Summary");
      pdf.addImage(imgData, "PNG", margin + 10, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 20;
    }

    // --- Insights Section ---
    if (insightsRef.current) {
      const insightsList = insightsRef.current.querySelectorAll("li");

      if (yOffset > pageHeight - margin - 60) {
        addNewPageWithBorder();
      } else {
        yOffset += 20;
      }

      addHeading("Generated Insights", 5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);

      insightsList.forEach((li) => {
        const insightText = li.innerText;
        const splitText = pdf.splitTextToSize(
          insightText,
          pageWidth - 2 * margin - 20
        );

        if (yOffset + splitText.length * 6 > pageHeight - margin - 30) {
          addNewPageWithBorder();
          addHeading("Generated Insights (cont.)", 0);
        }

        pdf.text(splitText, margin + 15, yOffset);
        yOffset += splitText.length * 6 + 6;
      });
    }

    pdf.save("Data_Visualization_Report.pdf");
  };

  return (
    <div className="report-exporter">
      <button onClick={handleDownloadPDF}>Download PDF Report</button>
    </div>
  );
}

export default ReportExporter;
