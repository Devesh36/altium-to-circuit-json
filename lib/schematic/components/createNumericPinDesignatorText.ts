import type { AltiumSchPinRecord } from "altiumts"
import type { SchematicPort, SchematicText } from "circuit-json"
import { scaleLength } from "../geometry"
import { parsePinNumber } from "./parsePinNumber"

const EDGE_VECTOR_BY_SIDE: Record<
  NonNullable<SchematicPort["side_of_component"]>,
  { x: number; y: number }
> = {
  bottom: { x: 0, y: 1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  top: { x: 0, y: -1 },
}

export function createNumericPinDesignatorText({
  pin,
  recordIndex,
  scale,
  schematicPort,
}: {
  pin: AltiumSchPinRecord
  recordIndex: number
  scale: number
  schematicPort: SchematicPort
}): SchematicText | undefined {
  const designator = pin.designator
  if (!designator || parsePinNumber(designator) === undefined) return undefined

  const pinConglomerate = pin.pinConglomerate
  const isDesignatorVisible =
    pinConglomerate === undefined || (pinConglomerate & 0x10) !== 0
  const side = schematicPort.side_of_component
  if (!isDesignatorVisible || !side) return undefined

  const edgeVector = EDGE_VECTOR_BY_SIDE[side]
  const halfPinLength = (schematicPort.distance_from_component_edge ?? 0.4) / 2
  const position = {
    x: schematicPort.center.x + edgeVector.x * halfPinLength,
    y: schematicPort.center.y + edgeVector.y * halfPinLength,
  }

  return {
    type: "schematic_text",
    anchor: "bottom_center",
    color: "#a90000",
    font_size: Math.max(scaleLength(1.5, scale), 0.15),
    position,
    rotation: side === "top" || side === "bottom" ? -90 : 0,
    schematic_component_id: schematicPort.schematic_component_id,
    schematic_sheet_id: schematicPort.schematic_sheet_id,
    schematic_text_id: `schematic_pin_designator_altium_${recordIndex}`,
    text: designator,
  }
}
