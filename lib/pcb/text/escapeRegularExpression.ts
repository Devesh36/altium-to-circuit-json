export function escapeRegularExpression(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}
