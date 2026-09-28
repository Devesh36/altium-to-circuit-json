import type { AltiumSchPinRecord } from "altiumts"
import type { SchematicPath, SchematicPort } from "circuit-json"
import { scaleLength } from "../geometry"

const EDGE_VECTOR_BY_SIDE: Record<
  NonNullable<SchematicPort["side_of_component"]>,
  { x: number; y: number }
> = {
  bottom: { x: 0, y: 1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  top: { x: 0, y: -1 },
}

export function createPinClockSymbol({
  pin,
  recordIndex,
  scale,
  schematicPort,
}: {
  pin: AltiumSchPinRecord
  recordIndex: number
  scale: number
  schematicPort: SchematicPort
}): SchematicPath | undefined {
  const side = schematicPort.side_of_component
  if (pin.getNumber("SYMBOL_INNEREDGE") !== 3 || !side) return undefined

  const edgeVector = EDGE_VECTOR_BY_SIDE[side]
  const pinLength = schematicPort.distance_from_component_edge ?? 0.4
  const bodyPosition = {
    x: schematicPort.center.x + edgeVector.x * pinLength,
    y: schematicPort.center.y + edgeVector.y * pinLength,
  }
  const clockDepth = scaleLength(4, scale)
  const clockHalfWidth = scaleLength(2, scale)
  const perpendicularVector = { x: -edgeVector.y, y: edgeVector.x }
  const clockTip = {
    x: bodyPosition.x + edgeVector.x * clockDepth,
    y: bodyPosition.y + edgeVector.y * clockDepth,
  }
  const clockBaseStart = {
    x: bodyPosition.x + perpendicularVector.x * clockHalfWidth,
    y: bodyPosition.y + perpendicularVector.y * clockHalfWidth,
  }
  const clockBaseEnd = {
    x: bodyPosition.x - perpendicularVector.x * clockHalfWidth,
    y: bodyPosition.y - perpendicularVector.y * clockHalfWidth,
  }

  return {
    type: "schematic_path",
    fill_color: "transparent",
    is_dashed: false,
    is_filled: false,
    points: [clockTip, clockBaseStart, clockBaseEnd, clockTip],
    schematic_component_id: schematicPort.schematic_component_id,
    schematic_path_id: `schematic_pin_clock_altium_${recordIndex}`,
    schematic_sheet_id: schematicPort.schematic_sheet_id,
    stroke_color: "#a90000",
    stroke_width: 0.02,
  }
}
