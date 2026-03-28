export type AlertLevel = "high risk" | "medium risk" | "low risk";

export function getMitigationBoost(level: AlertLevel) {
  if (level === "high risk") return 6;
  if (level === "medium risk") return 4;
  return 2;
}
