import type { AnyCircuitElement } from "circuit-json"
import { convertSchematicArcToPath } from "../rendering/convertSchematicArcToPath"

export function prepareOwnedComponentBodyElements(
  elements: AnyCircuitElement[],
): AnyCircuitElement[] {
  return elements
    .map((element) =>
      element.type === "schematic_arc"
        ? convertSchematicArcToPath(element)
        : element,
    )
    .sort((left, right) => {
      const leftIsFilled =
        "is_filled" in left && left.is_filled === true ? 1 : 0
      const rightIsFilled =
        "is_filled" in right && right.is_filled === true ? 1 : 0
      return rightIsFilled - leftIsFilled
    })
}
