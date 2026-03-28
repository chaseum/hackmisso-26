export function makeRiskSlug(input: { frameworkReference?: string | null; title: string }) {
  const source = input.frameworkReference?.trim() || input.title;

  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function makeRiskHref(input: { frameworkReference?: string | null; title: string }) {
  return `/report#risk-${makeRiskSlug(input)}`;
}
