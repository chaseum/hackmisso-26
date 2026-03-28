import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getLatestAssessmentReportData } from "@/lib/assessment-report";

function wrapText(text: string, maxChars = 92) {
  const words = text.split(/\s+/);
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

export async function GET() {
  try {
    const report = await getLatestAssessmentReportData();

    if (!report.assessment) {
      return NextResponse.json({ error: "No assessment report is available yet." }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pageSize: [number, number] = [612, 792];
    const margin = 42;
    let page = pdf.addPage(pageSize);
    let cursorY = pageSize[1] - margin;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY - requiredHeight < 40) {
        page = pdf.addPage(pageSize);
        cursorY = pageSize[1] - margin;
      }
    };

    const drawTextBlock = (text: string, x: number, y: number, size: number, bold = false, color = rgb(1, 1, 1)) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: bold ? boldFont : font,
        color,
      });
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(28);
      drawTextBlock(title, margin, cursorY, 16, true, rgb(0.97, 0.98, 1));
      cursorY -= 18;
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: pageSize[0] - margin, y: cursorY },
        thickness: 1,
        color: rgb(0.18, 0.25, 0.34),
      });
      cursorY -= 16;
    };

    const drawParagraph = (text: string, color = rgb(0.8, 0.84, 0.9)) => {
      wrapText(text).forEach((line) => {
        ensureSpace(18);
        drawTextBlock(line, margin, cursorY, 10.5, false, color);
        cursorY -= 16;
      });
    };

    const drawCard = (title: string, lines: string[], accent: ReturnType<typeof rgb>) => {
      const cardHeight = 24 + lines.length * 14 + 18;
      ensureSpace(cardHeight + 12);
      const cardTop = cursorY;
      page.drawRectangle({
        x: margin,
        y: cardTop - cardHeight,
        width: pageSize[0] - margin * 2,
        height: cardHeight,
        color: rgb(0.06, 0.09, 0.14),
        borderWidth: 1,
        borderColor: rgb(0.12, 0.18, 0.25),
      });
      page.drawRectangle({
        x: margin,
        y: cardTop - cardHeight,
        width: 5,
        height: cardHeight,
        color: accent,
      });

      let lineY = cardTop - 18;
      drawTextBlock(title, margin + 16, lineY, 11, true, rgb(1, 1, 1));
      lineY -= 16;

      lines.forEach((line) => {
        drawTextBlock(line, margin + 16, lineY, 10, false, rgb(0.8, 0.84, 0.9));
        lineY -= 14;
      });

      cursorY -= cardHeight + 12;
    };

    const headerHeight = 108;
    page.drawRectangle({
      x: margin,
      y: cursorY - headerHeight,
      width: pageSize[0] - margin * 2,
      height: headerHeight,
      color: rgb(0.05, 0.1, 0.16),
      borderWidth: 1,
      borderColor: rgb(0.1, 0.72, 0.82),
    });

    drawTextBlock("SeKeyity Assessment Report", margin + 20, cursorY - 28, 22, true, rgb(0.2, 0.88, 0.88));
    drawTextBlock(`Organization: ${report.orgName}`, margin + 20, cursorY - 50, 11, true, rgb(1, 1, 1));
    drawTextBlock(`Generated: ${new Date().toLocaleString("en-US")}`, margin + 20, cursorY - 66, 10, false, rgb(0.76, 0.81, 0.87));
    drawTextBlock(`Risk Score ${report.scorePercent}/100`, pageSize[0] - 190, cursorY - 34, 12, true, rgb(1, 1, 1));
    drawTextBlock(report.postureLabel, pageSize[0] - 190, cursorY - 54, 11, false, rgb(0.76, 0.81, 0.87));
    cursorY -= headerHeight + 24;

    drawSectionTitle("Executive Summary");
    drawCard(
      "Assessment Snapshot",
      [
        `Risk score: ${report.scorePercent}/100`,
        `Security posture: ${report.postureLabel}`,
        `Recommended actions: ${report.recommendations.length}`,
        `Identified vulnerabilities: ${report.vulnerabilities.length}`,
      ],
      rgb(0.1, 0.72, 0.82),
    );

    drawSectionTitle("Recommended Actions");
    report.recommendations.forEach((recommendation, index) => {
      const accent =
        recommendation.priority === "high"
          ? rgb(0.96, 0.43, 0.26)
          : recommendation.priority === "medium"
            ? rgb(0.94, 0.76, 0.17)
            : rgb(0.1, 0.72, 0.82);
      const lines = [
        `Priority: ${(recommendation.priority ?? "low").toUpperCase()}`,
        `Reference: ${recommendation.framework_reference ?? "No framework reference"}`,
        ...wrapText(recommendation.why_it_matters, 82),
        ...wrapText(`Action: ${recommendation.actionable_fix}`, 82),
      ];
      drawCard(`${index + 1}. ${recommendation.title}`, lines, accent);
    });

    drawSectionTitle("Identified Vulnerabilities");
    report.vulnerabilities.forEach((vulnerability, index) => {
      const accent =
        vulnerability.priority === "high"
          ? rgb(0.96, 0.43, 0.26)
          : vulnerability.priority === "medium"
            ? rgb(0.94, 0.76, 0.17)
            : rgb(0.1, 0.72, 0.82);
      const lines = [
        `${vulnerability.priority.toUpperCase()} | ${vulnerability.category}`,
        `${vulnerability.frameworkReference} | ${vulnerability.frameworkName}`,
        ...wrapText(vulnerability.description, 82),
        ...(vulnerability.actionableFix ? wrapText(`Suggested action: ${vulnerability.actionableFix}`, 82) : []),
      ];
      drawCard(`${index + 1}. ${vulnerability.title}`, lines, accent);
    });

    drawSectionTitle("Notes");
    drawParagraph("This export reflects the latest completed SeKeyity assessment and summarizes the most important risks and next actions for the organization.");

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="sekeyity-assessment-report.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report PDF.";
    const status = message === "You must be signed in." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
