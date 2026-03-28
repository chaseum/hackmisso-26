"use client";

import type { ReactNode } from "react";

function renderInlineFormatting(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-white">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function isBulletLine(line: string) {
  return /^[-*]\s+/.test(line);
}

function isNumberedLine(line: string) {
  return /^\d+\.\s+/.test(line);
}

export function FormattedAiContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.every(isBulletLine)) {
          return (
            <ul key={`block-${blockIndex}`} className="space-y-2 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`bullet-${blockIndex}-${lineIndex}`} className="list-disc">
                  {renderInlineFormatting(line.replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every(isNumberedLine)) {
          return (
            <ol key={`block-${blockIndex}`} className="space-y-2 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`number-${blockIndex}-${lineIndex}`} className="list-decimal">
                  {renderInlineFormatting(line.replace(/^\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        const lineBreaks: ReactNode[] = [];

        lines.forEach((line, lineIndex) => {
          if (lineIndex > 0) {
            lineBreaks.push(<br key={`break-${blockIndex}-${lineIndex}`} />);
          }

          lineBreaks.push(
            <span key={`line-${blockIndex}-${lineIndex}`}>{renderInlineFormatting(line)}</span>,
          );
        });

        return (
          <p key={`paragraph-${blockIndex}`} className="leading-7">
            {lineBreaks}
          </p>
        );
      })}
    </div>
  );
}
