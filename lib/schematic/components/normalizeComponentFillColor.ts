export function normalizeComponentFillColor({
  fillColor,
  strokeColor,
}: {
  fillColor: string | undefined
  strokeColor: string | undefined
}): string | undefined {
  if (
    !fillColor ||
    fillColor === "transparent" ||
    fillColor === "none" ||
    fillColor.toLowerCase() === "#ffffff"
  )
    return fillColor
  if (fillColor === strokeColor) return "#840000"
  // Altium may use slightly different blues for a symbol's outline and ink
  // fill. Keep contrasting backgrounds (especially white inversion bubbles
  // and pale switch enclosures), but recolor blue ink together with strokes.
  const channels = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(fillColor)
  if (!channels) return fillColor
  const red = Number.parseInt(channels[1] ?? "", 16)
  const green = Number.parseInt(channels[2] ?? "", 16)
  const blue = Number.parseInt(channels[3] ?? "", 16)
  return blue > Math.max(red, green) ? "#840000" : fillColor
}
