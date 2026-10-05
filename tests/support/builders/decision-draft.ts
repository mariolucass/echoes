export function decisionDraft(
  overrides: Partial<{
    title: string;
    description: string;
    context: string;
  }> = {},
) {
  return { title: "Decisão de teste", ...overrides };
}
