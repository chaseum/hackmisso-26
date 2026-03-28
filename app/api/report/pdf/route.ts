import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { buildVulnerabilityBreakdown, getLatestAssessmentReportData, getSecurityLetterGrade } from "@/lib/assessment-report";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_MARGIN = 42;

const COLORS = {
  background: rgb(0.015, 0.03, 0.05),
  panel: rgb(0.04, 0.07, 0.12),
  panelAlt: rgb(0.05, 0.1, 0.16),
  border: rgb(0.1, 0.15, 0.22),
  accent: rgb(0.13, 0.82, 0.84),
  white: rgb(0.98, 0.99, 1),
  muted: rgb(0.72, 0.78, 0.84),
  rose: rgb(0.98, 0.48, 0.56),
  amber: rgb(0.97, 0.8, 0.29),
  emerald: rgb(0.34, 0.89, 0.58),
};

type PageState = {
  page: PDFPage;
  cursorY: number;
  pageNumber: number;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sanitizeText(text: string) {
  return text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

function formatIssueCount(count: number) {
  return `${count} ${count === 1 ? "issue" : "issues"}`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = sanitizeText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawPageBackground(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: COLORS.background,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: COLORS.accent,
  });
}

function createPage(pdf: PDFDocument, pageNumber: number) {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageBackground(page);

  return {
    page,
    cursorY: PAGE_HEIGHT - MARGIN,
    pageNumber,
  } satisfies PageState;
}

function ensureSpace(pdf: PDFDocument, state: PageState, height: number) {
  if (state.cursorY - height >= BOTTOM_MARGIN) {
    return state;
  }

  return createPage(pdf, state.pageNumber + 1);
}

function drawSectionCard(page: PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: COLORS.panel,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
}

function drawWrappedBlock(page: PDFPage, text: string, options: {
  x: number;
  y: number;
  width: number;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
  lineHeight?: number;
}) {
  const lines = wrapText(text, options.font, options.size, options.width);
  const lineHeight = options.lineHeight ?? options.size * 1.45;

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * lineHeight,
      size: options.size,
      font: options.font,
      color: options.color,
    });
  });

  return lines.length * lineHeight;
}

export async function GET() {
  try {
    const report = await getLatestAssessmentReportData();

    if (!report.assessment) {
      return NextResponse.json({ error: "No assessment report is available yet." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let state = createPage(pdf, 1);

    const generatedAt = formatTimestamp(report.assessment.created_at);
    const grade = getSecurityLetterGrade(report.securityScore);
    const breakdown = buildVulnerabilityBreakdown(report.vulnerabilities);
    const highRiskCount = report.vulnerabilities.filter((item) => item.priority === "high").length;
    const mediumRiskCount = report.vulnerabilities.filter((item) => item.priority === "medium").length;
    const lowRiskCount = report.vulnerabilities.filter((item) => item.priority === "low").length;

    state.page.drawRectangle({
      x: MARGIN,
      y: PAGE_HEIGHT - 166,
      width: CONTENT_WIDTH,
      height: 126,
      color: COLORS.panelAlt,
      borderColor: COLORS.accent,
      borderWidth: 1,
    });
    state.page.drawText("Executive Security Brief", {
      x: MARGIN + 22,
      y: PAGE_HEIGHT - 80,
      size: 26,
      font: bold,
      color: COLORS.white,
    });
    state.page.drawText(report.orgName, {
      x: MARGIN + 22,
      y: PAGE_HEIGHT - 108,
      size: 13,
      font: bold,
      color: COLORS.accent,
    });
    state.page.drawText(`Generated ${generatedAt}`, {
      x: MARGIN + 22,
      y: PAGE_HEIGHT - 126,
      size: 10,
      font: regular,
      color: COLORS.muted,
    });

    state.page.drawRectangle({
      x: PAGE_WIDTH - MARGIN - 146,
      y: PAGE_HEIGHT - 146,
      width: 124,
      height: 86,
      color: COLORS.panel,
      borderColor: COLORS.border,
      borderWidth: 1,
    });
    state.page.drawText("Risk Grade", {
      x: PAGE_WIDTH - MARGIN - 122,
      y: PAGE_HEIGHT - 88,
      size: 10,
      font: bold,
      color: COLORS.muted,
    });
    state.page.drawText(grade, {
      x: PAGE_WIDTH - MARGIN - 118,
      y: PAGE_HEIGHT - 128,
      size: 34,
      font: bold,
      color: grade === "A" || grade === "B" ? COLORS.emerald : grade === "C" ? COLORS.amber : COLORS.rose,
    });
    state.page.drawText(`${report.securityScore}/100`, {
      x: PAGE_WIDTH - MARGIN - 78,
      y: PAGE_HEIGHT - 122,
      size: 10,
      font: regular,
      color: COLORS.white,
    });

    const summaryY = PAGE_HEIGHT - 210;
    const summaryCardWidth = (CONTENT_WIDTH - 24) / 3;
    [
      { label: "Security Score", value: `${report.securityScore}/100`, detail: `${report.riskScorePercent}/100 residual risk`, color: COLORS.accent },
      { label: "Vulnerabilities", value: String(report.vulnerabilities.length), detail: `${highRiskCount} high-priority gaps`, color: COLORS.rose },
      { label: "Recommendations", value: String(report.recommendations.length), detail: "AI remediation plan included", color: COLORS.amber },
    ].forEach((item, index) => {
      const x = MARGIN + index * (summaryCardWidth + 12);
      drawSectionCard(state.page, x, summaryY - 90, summaryCardWidth, 78);
      state.page.drawRectangle({ x: x + 16, y: summaryY - 30, width: 8, height: 8, color: item.color });
      state.page.drawText(item.label, {
        x: x + 30,
        y: summaryY - 28,
        size: 10,
        font: bold,
        color: COLORS.muted,
      });
      state.page.drawText(item.value, {
        x: x + 16,
        y: summaryY - 58,
        size: 20,
        font: bold,
        color: COLORS.white,
      });
      state.page.drawText(item.detail, {
        x: x + 16,
        y: summaryY - 74,
        size: 9,
        font: regular,
        color: COLORS.muted,
      });
    });

    const leftX = MARGIN;
    const panelTop = summaryY - 112;
    drawSectionCard(state.page, leftX, panelTop - 180, 250, 180);
    state.page.drawText("Assessment Snapshot", {
      x: leftX + 18,
      y: panelTop - 24,
      size: 14,
      font: bold,
      color: COLORS.white,
    });
    state.page.drawText(report.postureLabel, {
      x: leftX + 18,
      y: panelTop - 48,
      size: 18,
      font: bold,
      color: COLORS.accent,
    });
    [
      `${highRiskCount} high-priority vulnerabilities`,
      `${mediumRiskCount} medium-priority vulnerabilities`,
      `${lowRiskCount} low-priority vulnerabilities`,
      `${report.assessment.raw_responses.filter((response) => response.userAnsweredYes).length} controls currently passing`,
    ].forEach((line, index) => {
      state.page.drawText(`- ${line}`, {
        x: leftX + 18,
        y: panelTop - 78 - index * 22,
        size: 10,
        font: regular,
        color: COLORS.muted,
      });
    });

    const rightX = leftX + 266;
    drawSectionCard(state.page, rightX, panelTop - 180, CONTENT_WIDTH - 266, 180);
    state.page.drawText("Vulnerability Mix", {
      x: rightX + 18,
      y: panelTop - 24,
      size: 14,
      font: bold,
      color: COLORS.white,
    });
    state.page.drawText("Categories with the most exposure in the latest assessment", {
      x: rightX + 18,
      y: panelTop - 42,
      size: 9,
      font: regular,
      color: COLORS.muted,
    });
    breakdown.slice(0, 5).forEach((item, index) => {
      const barY = panelTop - 72 - index * 24;
      state.page.drawText(item.label, {
        x: rightX + 18,
        y: barY + 8,
        size: 10,
        font: bold,
        color: COLORS.white,
      });
      state.page.drawText(formatIssueCount(item.count), {
        x: rightX + 198,
        y: barY + 8,
        size: 9,
        font: regular,
        color: COLORS.muted,
      });
      state.page.drawRectangle({
        x: rightX + 18,
        y: barY - 4,
        width: CONTENT_WIDTH - 320,
        height: 8,
        color: COLORS.border,
      });
      state.page.drawRectangle({
        x: rightX + 18,
        y: barY - 4,
        width: (CONTENT_WIDTH - 320) * (item.percentage / 100),
        height: 8,
        color: rgb(item.color.red, item.color.green, item.color.blue),
      });
    });

    const noteY = 86;
    state.page.drawRectangle({
      x: MARGIN,
      y: noteY,
      width: CONTENT_WIDTH,
      height: 72,
      color: COLORS.panel,
      borderColor: COLORS.border,
      borderWidth: 1,
    });
    state.page.drawText("Leadership Note", {
      x: MARGIN + 18,
      y: noteY + 46,
      size: 11,
      font: bold,
      color: COLORS.white,
    });
    drawWrappedBlock(
      state.page,
      "This report turns the latest assessment into a board-ready snapshot. Page 2 lists the exposed controls, and Page 3 translates them into prioritized actions your team can start immediately.",
      {
        x: MARGIN + 18,
        y: noteY + 30,
        width: CONTENT_WIDTH - 36,
        font: regular,
        size: 9,
        color: COLORS.muted,
        lineHeight: 12,
      },
    );

    state = createPage(pdf, 2);
    state.page.drawText("Failed Controls and Vulnerabilities", {
      x: MARGIN,
      y: state.cursorY,
      size: 24,
      font: bold,
      color: COLORS.white,
    });
    state.page.drawText("Plain-language explanation of each exposed area from the latest assessment.", {
      x: MARGIN,
      y: state.cursorY - 22,
      size: 11,
      font: regular,
      color: COLORS.muted,
    });
    state.cursorY -= 52;

    for (const vulnerability of report.vulnerabilities) {
      const titleLines = wrapText(vulnerability.title, bold, 14, CONTENT_WIDTH - 40);
      const descriptionLines = wrapText(vulnerability.description, regular, 10, CONTENT_WIDTH - 40);
      const fixLines = vulnerability.actionableFix ? wrapText(vulnerability.actionableFix, regular, 10, CONTENT_WIDTH - 56) : [];
      const titleHeight = Math.max(20, titleLines.length * 18);
      const descriptionHeight = descriptionLines.length * 14;
      const fixHeight = fixLines.length > 0 ? 40 + fixLines.length * 14 : 0;
      const cardHeight = 54 + titleHeight + descriptionHeight + fixHeight + 20;

      state = ensureSpace(pdf, state, cardHeight + 12);

      drawSectionCard(state.page, MARGIN, state.cursorY - cardHeight, CONTENT_WIDTH, cardHeight);
      const priorityColor = vulnerability.priority === "high" ? COLORS.rose : vulnerability.priority === "medium" ? COLORS.amber : COLORS.emerald;
      state.page.drawRectangle({
        x: MARGIN,
        y: state.cursorY - cardHeight,
        width: 6,
        height: cardHeight,
        color: priorityColor,
      });

      drawWrappedBlock(state.page, vulnerability.title, {
        x: MARGIN + 18,
        y: state.cursorY - 24,
        width: CONTENT_WIDTH - 36,
        font: bold,
        size: 14,
        color: COLORS.white,
        lineHeight: 18,
      });
      const metaY = state.cursorY - 24 - titleHeight;
      state.page.drawText(`${vulnerability.priority.toUpperCase()} PRIORITY  |  ${vulnerability.frameworkReference}  |  ${vulnerability.frameworkName}`, {
        x: MARGIN + 18,
        y: metaY,
        size: 9,
        font: regular,
        color: priorityColor,
      });
      drawWrappedBlock(state.page, vulnerability.description, {
        x: MARGIN + 18,
        y: metaY - 18,
        width: CONTENT_WIDTH - 36,
        font: regular,
        size: 10,
        color: COLORS.muted,
        lineHeight: 14,
      });

      if (fixLines.length > 0) {
        const fixBoxY = metaY - 32 - descriptionHeight;
        state.page.drawRectangle({
          x: MARGIN + 18,
          y: fixBoxY - (fixLines.length * 14 + 20),
          width: CONTENT_WIDTH - 36,
          height: fixLines.length * 14 + 26,
          color: rgb(0.03, 0.16, 0.18),
          borderColor: COLORS.accent,
          borderWidth: 0.5,
        });
        state.page.drawText("Suggested first step", {
          x: MARGIN + 30,
          y: fixBoxY - 12,
          size: 9,
          font: bold,
          color: COLORS.accent,
        });
        drawWrappedBlock(state.page, vulnerability.actionableFix!, {
          x: MARGIN + 30,
          y: fixBoxY - 28,
          width: CONTENT_WIDTH - 60,
          font: regular,
          size: 10,
          color: COLORS.white,
          lineHeight: 14,
        });
      }

      state.cursorY -= cardHeight + 12;
    }

    state = createPage(pdf, state.pageNumber + 1);
    state.page.drawText("AI Recommendations", {
      x: MARGIN,
      y: state.cursorY,
      size: 24,
      font: bold,
      color: COLORS.white,
    });
    state.page.drawText("Prioritized, plain-English actions generated from the failed controls and framework context.", {
      x: MARGIN,
      y: state.cursorY - 22,
      size: 11,
      font: regular,
      color: COLORS.muted,
    });
    state.cursorY -= 52;

    for (const recommendation of report.recommendations) {
      const titleLines = wrapText(recommendation.title, bold, 14, CONTENT_WIDTH - 40);
      const whyLines = wrapText(recommendation.why_it_matters, regular, 10, CONTENT_WIDTH - 40);
      const actionLines = wrapText(recommendation.actionable_fix, regular, 10, CONTENT_WIDTH - 40);
      const titleHeight = Math.max(20, titleLines.length * 18);
      const cardHeight = 76 + titleHeight + whyLines.length * 14 + actionLines.length * 14 + 20;

      state = ensureSpace(pdf, state, cardHeight + 12);

      drawSectionCard(state.page, MARGIN, state.cursorY - cardHeight, CONTENT_WIDTH, cardHeight);
      const priorityColor = recommendation.priority === "high" ? COLORS.rose : recommendation.priority === "medium" ? COLORS.amber : COLORS.emerald;

      drawWrappedBlock(state.page, recommendation.title, {
        x: MARGIN + 18,
        y: state.cursorY - 24,
        width: CONTENT_WIDTH - 36,
        font: bold,
        size: 14,
        color: COLORS.white,
        lineHeight: 18,
      });
      const metaY = state.cursorY - 24 - titleHeight;
      state.page.drawText(`${(recommendation.priority ?? "low").toUpperCase()} PRIORITY${recommendation.framework_reference ? `  |  ${recommendation.framework_reference}` : ""}`, {
        x: MARGIN + 18,
        y: metaY,
        size: 9,
        font: regular,
        color: priorityColor,
      });

      state.page.drawText("Why it matters", {
        x: MARGIN + 18,
        y: metaY - 22,
        size: 10,
        font: bold,
        color: COLORS.accent,
      });
      drawWrappedBlock(state.page, recommendation.why_it_matters, {
        x: MARGIN + 18,
        y: metaY - 38,
        width: CONTENT_WIDTH - 36,
        font: regular,
        size: 10,
        color: COLORS.muted,
        lineHeight: 14,
      });

      const actionHeaderY = metaY - 52 - whyLines.length * 14;
      state.page.drawText("Recommended action", {
        x: MARGIN + 18,
        y: actionHeaderY,
        size: 10,
        font: bold,
        color: COLORS.white,
      });
      drawWrappedBlock(state.page, recommendation.actionable_fix, {
        x: MARGIN + 18,
        y: actionHeaderY - 16,
        width: CONTENT_WIDTH - 36,
        font: regular,
        size: 10,
        color: COLORS.white,
        lineHeight: 14,
      });

      state.cursorY -= cardHeight + 12;
    }

    pdf.getPages().forEach((page, index) => {
      page.drawText(`Page ${index + 1}`, {
        x: PAGE_WIDTH - MARGIN - 36,
        y: 22,
        size: 10,
        font: regular,
        color: COLORS.muted,
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
