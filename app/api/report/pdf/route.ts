import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  buildVulnerabilityBreakdown,
  getLatestAssessmentReportData,
  getSecurityLetterGrade,
  getSecurityScore,
} from "@/lib/assessment-report";

function wrapText(text: string, maxChars: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function drawText(page: PDFPage, text: string, options: Parameters<PDFPage["drawText"]>[1]) {
  page.drawText(text, options);
}

type PDFPage = Awaited<ReturnType<PDFDocument["addPage"]>>;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describePieSlice(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function drawSectionCard(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0.04, 0.07, 0.12),
    borderColor: rgb(0.1, 0.15, 0.22),
    borderWidth: 1,
  });
}

export async function GET() {
  try {
    const report = await getLatestAssessmentReportData();

    if (!report.assessment) {
      return NextResponse.json({ error: "No assessment report is available yet." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([792, 612]);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const margin = 28;
    const accent = rgb(0.13, 0.82, 0.84);
    const softText = rgb(0.72, 0.78, 0.84);
    const white = rgb(0.98, 0.99, 1);
    const securityScore = getSecurityScore(report.scorePercent);
    const grade = getSecurityLetterGrade(report.scorePercent);
    const breakdown = buildVulnerabilityBreakdown(report.vulnerabilities);
    const generatedAt = formatTimestamp(report.assessment.created_at);
    const highRiskCount = report.vulnerabilities.filter((item) => item.priority === "high").length;
    const mediumRiskCount = report.vulnerabilities.filter((item) => item.priority === "medium").length;
    const lowRiskCount = report.vulnerabilities.filter((item) => item.priority === "low").length;
    const topRecommendations = report.recommendations.slice(0, 3);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.015, 0.03, 0.05),
    });

    page.drawRectangle({
      x: margin,
      y: pageHeight - 144,
      width: pageWidth - margin * 2,
      height: 116,
      color: rgb(0.05, 0.1, 0.16),
      borderColor: accent,
      borderWidth: 1,
    });

    drawText(page, "Executive Security Brief", {
      x: margin + 22,
      y: pageHeight - 64,
      size: 24,
      font: boldFont,
      color: white,
    });
    drawText(page, report.orgName, {
      x: margin + 22,
      y: pageHeight - 90,
      size: 12,
      font: boldFont,
      color: accent,
    });
    drawText(page, `Generated ${generatedAt}`, {
      x: margin + 22,
      y: pageHeight - 108,
      size: 10,
      font,
      color: softText,
    });

    page.drawRectangle({
      x: pageWidth - 198,
      y: pageHeight - 126,
      width: 142,
      height: 78,
      color: rgb(0.03, 0.06, 0.1),
      borderColor: rgb(0.15, 0.22, 0.29),
      borderWidth: 1,
    });
    drawText(page, "Risk Grade", {
      x: pageWidth - 176,
      y: pageHeight - 70,
      size: 10,
      font: boldFont,
      color: softText,
    });
    drawText(page, grade, {
      x: pageWidth - 176,
      y: pageHeight - 110,
      size: 34,
      font: boldFont,
      color: grade === "A" || grade === "B" ? rgb(0.34, 0.89, 0.58) : grade === "C" ? rgb(0.97, 0.8, 0.29) : rgb(0.98, 0.48, 0.56),
    });
    drawText(page, `${securityScore}/100 security score`, {
      x: pageWidth - 126,
      y: pageHeight - 104,
      size: 10,
      font,
      color: white,
    });

    const topY = pageHeight - 182;
    const summaryCardWidth = 228;
    const summaryGap = 16;
    const summaryItems = [
      { label: "Overall Posture", value: report.postureLabel, detail: `${report.scorePercent}/100 risk score`, color: accent },
      { label: "Vulnerabilities", value: String(report.vulnerabilities.length), detail: `${highRiskCount} high risk items`, color: rgb(0.98, 0.48, 0.56) },
      { label: "AI Recommendations", value: String(report.recommendations.length), detail: "Top 3 highlighted below", color: rgb(0.97, 0.8, 0.29) },
    ];

    summaryItems.forEach((item, index) => {
      const x = margin + index * (summaryCardWidth + summaryGap);
      drawSectionCard(page, x, topY - 86, summaryCardWidth, 74);
      page.drawRectangle({
        x: x + 16,
        y: topY - 36,
        width: 8,
        height: 8,
        color: item.color,
      });
      drawText(page, item.label, {
        x: x + 30,
        y: topY - 34,
        size: 10,
        font: boldFont,
        color: softText,
      });
      drawText(page, item.value, {
        x: x + 16,
        y: topY - 62,
        size: 20,
        font: boldFont,
        color: white,
      });
      drawText(page, item.detail, {
        x: x + 16,
        y: topY - 76,
        size: 9,
        font,
        color: softText,
      });
    });

    const leftColumnX = margin;
    const leftColumnY = topY - 206;
    const leftColumnWidth = 286;
    drawSectionCard(page, leftColumnX, leftColumnY, leftColumnWidth, 190);
    drawText(page, "Vulnerability Mix", {
      x: leftColumnX + 18,
      y: leftColumnY + 166,
      size: 14,
      font: boldFont,
      color: white,
    });
    drawText(page, "By assessment category", {
      x: leftColumnX + 18,
      y: leftColumnY + 150,
      size: 9,
      font,
      color: softText,
    });

    const pieCenterX = leftColumnX + 86;
    const pieCenterY = leftColumnY + 82;
    const pieRadius = 48;
    let startAngle = 0;

    if (breakdown.length > 0) {
      breakdown.forEach((item) => {
        const sweep = (item.percentage / 100) * 360;
        page.drawSvgPath(describePieSlice(pieCenterX, pieCenterY, pieRadius, startAngle, startAngle + sweep), {
          color: rgb(item.color.red, item.color.green, item.color.blue),
        });
        startAngle += sweep;
      });

      page.drawCircle({
        x: pieCenterX,
        y: pieCenterY,
        size: 20,
        color: rgb(0.04, 0.07, 0.12),
      });

      breakdown.slice(0, 4).forEach((item, index) => {
        const legendY = leftColumnY + 120 - index * 28;
        const legendX = leftColumnX + 152;

        page.drawCircle({
          x: legendX,
          y: legendY,
          size: 4,
          color: rgb(item.color.red, item.color.green, item.color.blue),
        });
        drawText(page, item.label, {
          x: legendX + 12,
          y: legendY - 3,
          size: 10,
          font: boldFont,
          color: white,
        });
        drawText(page, `${item.count} issues (${item.percentage}%)`, {
          x: legendX + 12,
          y: legendY - 15,
          size: 8.5,
          font,
          color: softText,
        });
      });
    } else {
      drawText(page, "No vulnerabilities were captured in the latest assessment.", {
        x: leftColumnX + 18,
        y: leftColumnY + 108,
        size: 10,
        font,
        color: softText,
      });
    }

    drawText(page, "Priority Split", {
      x: leftColumnX + 18,
      y: leftColumnY + 28,
      size: 10,
      font: boldFont,
      color: white,
    });
    drawText(page, `${highRiskCount} high`, {
      x: leftColumnX + 18,
      y: leftColumnY + 12,
      size: 9,
      font,
      color: rgb(0.98, 0.48, 0.56),
    });
    drawText(page, `${mediumRiskCount} medium`, {
      x: leftColumnX + 88,
      y: leftColumnY + 12,
      size: 9,
      font,
      color: rgb(0.97, 0.8, 0.29),
    });
    drawText(page, `${lowRiskCount} low`, {
      x: leftColumnX + 180,
      y: leftColumnY + 12,
      size: 9,
      font,
      color: rgb(0.34, 0.89, 0.58),
    });

    const rightColumnX = leftColumnX + leftColumnWidth + 18;
    const rightColumnWidth = pageWidth - margin - rightColumnX;
    drawSectionCard(page, rightColumnX, leftColumnY, rightColumnWidth, 190);
    drawText(page, "Top 3 AI Recommendations", {
      x: rightColumnX + 18,
      y: leftColumnY + 166,
      size: 14,
      font: boldFont,
      color: white,
    });
    drawText(page, "Board-ready summary of next actions", {
      x: rightColumnX + 18,
      y: leftColumnY + 150,
      size: 9,
      font,
      color: softText,
    });

    topRecommendations.forEach((recommendation, index) => {
      const rowTop = leftColumnY + 128 - index * 48;
      const priorityColor =
        recommendation.priority === "high"
          ? rgb(0.98, 0.48, 0.56)
          : recommendation.priority === "medium"
            ? rgb(0.97, 0.8, 0.29)
            : rgb(0.34, 0.89, 0.58);

      page.drawRectangle({
        x: rightColumnX + 18,
        y: rowTop - 36,
        width: rightColumnWidth - 36,
        height: 38,
        color: rgb(0.03, 0.06, 0.1),
        borderColor: rgb(0.1, 0.15, 0.22),
        borderWidth: 1,
      });
      page.drawRectangle({
        x: rightColumnX + 18,
        y: rowTop - 36,
        width: 6,
        height: 38,
        color: priorityColor,
      });
      drawText(page, `${index + 1}. ${recommendation.title}`, {
        x: rightColumnX + 32,
        y: rowTop - 14,
        size: 10.5,
        font: boldFont,
        color: white,
      });

      const summaryLine = wrapText(recommendation.actionable_fix, 74)[0] ?? recommendation.actionable_fix;
      drawText(page, summaryLine, {
        x: rightColumnX + 32,
        y: rowTop - 28,
        size: 8.5,
        font,
        color: softText,
      });
    });

    const footerY = 40;
    page.drawRectangle({
      x: margin,
      y: footerY,
      width: pageWidth - margin * 2,
      height: 72,
      color: rgb(0.04, 0.07, 0.12),
      borderColor: rgb(0.1, 0.15, 0.22),
      borderWidth: 1,
    });
    drawText(page, "Leadership Note", {
      x: margin + 18,
      y: footerY + 48,
      size: 11,
      font: boldFont,
      color: white,
    });
    wrapText(
      "This brief summarizes the latest SeKeyity assessment so board members, advisors, and team leads can see current exposure at a glance and approve the next wave of remediation work.",
      118,
    ).forEach((line, index) => {
      drawText(page, line, {
        x: margin + 18,
        y: footerY + 30 - index * 12,
        size: 9,
        font,
        color: softText,
      });
    });

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="sekeyity-executive-security-brief.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report PDF.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
