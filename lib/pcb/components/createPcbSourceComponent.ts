import type { AltiumComponentRecord } from "altiumts"
import type { SourceSimpleChip } from "circuit-json"

export function createPcbSourceComponent({
  component,
  componentIndex,
}: {
  component: AltiumComponentRecord
  componentIndex: number
}): SourceSimpleChip {
  const designator =
    component.designator?.trim() || `component_${componentIndex}`
  const displayText = component.comment?.trim()
  return {
    type: "source_component",
    ftype: "simple_chip",
    source_component_id: `source_component_altium_${componentIndex}`,
    name: designator,
    display_name: designator,
    ...(displayText ? { display_value: displayText } : {}),
  }
}
