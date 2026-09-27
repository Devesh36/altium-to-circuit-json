import type { AltiumPcbDocument, AltiumTextRecord } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { getPcbComponentIdForRecord } from "../identifiers"
import { mapOverlayLayer } from "../layers"
import { mapTextAnchor } from "../text"

export function convertPcbSilkscreenText({
  document,
  record,
  recordIndex,
}: {
  document: AltiumPcbDocument
  record: AltiumTextRecord
  recordIndex: number
}): PcbSilkscreenText | undefined {
  if (!record.position || !record.text) return undefined

  const component = document.getComponentForRecord(record)
  const specialString = record.text.trim().toLowerCase()
  const text =
    specialString === ".designator"
      ? component?.designator
      : specialString === ".comment"
        ? component?.comment
        : record.text
  if (!text) return undefined

  return {
    type: "pcb_silkscreen_text",
    pcb_silkscreen_text_id: `pcb_silkscreen_text_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    text,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapTextAnchor(record.justification),
    ccw_rotation: record.rotation,
    layer: mapOverlayLayer(record.layer),
    is_mirrored: record.mirrored,
  }
}
