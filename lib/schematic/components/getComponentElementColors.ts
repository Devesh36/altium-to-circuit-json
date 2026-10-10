import type { AnyCircuitElement } from "circuit-json"

export function getComponentElementColors(
  element: AnyCircuitElement,
): Partial<Record<"color" | "stroke_color" | "fill_color", string>> {
  const ink = "#840000"
  if (element.type === "schematic_text") {
    return {
      color: element.schematic_text_id.startsWith("schematic_pin_designator_")
        ? "#a90000"
        : element.schematic_text_id.startsWith("schematic_pin_name_")
          ? "#006464"
          : "#000000",
    }
  }
  if (element.type === "schematic_line" || element.type === "schematic_arc")
    return { color: ink }
  if (
    element.type !== "schematic_path" &&
    element.type !== "schematic_circle" &&
    element.type !== "schematic_rect"
  )
    return {}

  const strokeColor =
    element.type === "schematic_path" ? element.stroke_color : element.color
  let fillColor = element.fill_color
  // Keep contrasting backgrounds and white inversion bubbles. Source ink
  // can use slightly different blues for the outline and filled interior.
  if (
    fillColor &&
    fillColor !== "transparent" &&
    fillColor !== "none" &&
    fillColor.toLowerCase() !== "#ffffff"
  ) {
    const rgb = /^#[\da-f]{6}$/iu.test(fillColor)
      ? Number.parseInt(fillColor.slice(1), 16)
      : undefined
    const isBlue =
      rgb !== undefined &&
      (rgb & 0xff) > Math.max(rgb >>> 16, (rgb >>> 8) & 0xff)
    if (fillColor === strokeColor || isBlue) fillColor = ink
  }
  return {
    ...(element.type === "schematic_path"
      ? { stroke_color: ink }
      : { color: ink }),
    fill_color: fillColor,
  }
}
