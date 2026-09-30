export function normalizeLogicGatePinName(
  name: string | undefined,
): string | undefined {
  return name
    ?.trim()
    .toUpperCase()
    .replace(/^\d+(?=[A-Z]+$)/u, "")
}
