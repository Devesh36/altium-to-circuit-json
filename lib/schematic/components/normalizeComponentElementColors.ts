import type { AnyCircuitElement } from "circuit-json"
import { normalizeComponentFillColor } from "./normalizeComponentFillColor"

export function normalizeComponentElementColors(
  element: AnyCircuitElement,
): AnyCircuitElement {
  // Preserved artwork uses the same ink as native Circuit JSON symbols.
  // Apply this only to component-owned graphics, never document annotations.
  if (element.type === "schematic_text") {
    const color = element.schematic_text_id.startsWith(
      "schematic_pin_designator_",
    )
      ? "#a90000"
      : element.schematic_text_id.startsWith("schematic_pin_name_")
        ? "#006464"
        : "#000000"
    return { ...element, color }
  }
  if (element.type === "schematic_line") {
    return { ...element, color: "#840000" }
  }
  if (element.type === "schematic_path") {
    return {
      ...element,
      stroke_color: "#840000",
      fill_color: normalizeComponentFillColor({
        fillColor: element.fill_color,
        strokeColor: element.stroke_color,
      }),
    }
  }
  if (
    element.type === "schematic_circle" ||
    element.type === "schematic_rect"
  ) {
    return {
      ...element,
      color: "#840000",
      fill_color: normalizeComponentFillColor({
        fillColor: element.fill_color,
        strokeColor: element.color,
      }),
    }
  }
  if (element.type === "schematic_arc") {
    return { ...element, color: "#840000" }
  }
  return element
}
