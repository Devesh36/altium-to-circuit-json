import type { AltiumTextRecord } from "altiumts"
import type { PcbCopperText } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { getPcbComponentIdForRecord } from "../identifiers"
import type { PcbConversionContext } from "../model"
import { mapTextAnchor } from "./mapTextAnchor"
import { resolvePcbTextSpecialStrings } from "./resolvePcbTextSpecialStrings"

export function convertPcbCopperText({
  context,
  record,
  recordIndex,
}: {
  context: PcbConversionContext
  record: AltiumTextRecord
  recordIndex: number
}): PcbCopperText | undefined {
  if (!record.position || !record.text) return undefined
  const { layerMap, options } = context
  const layer = layerMap.getLayer(record.layer)
  if (!layer) return undefined
  const text = resolvePcbTextSpecialStrings({
    layer: record.layer,
    layerMap,
    project: options.project,
    text: record.text,
  })
  if (!text) return undefined
  return {
    type: "pcb_copper_text",
    pcb_copper_text_id: `pcb_copper_text_altium_${recordIndex}`,
    pcb_component_id: getPcbComponentIdForRecord(record),
    text,
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.heightMils ?? 30),
    anchor_position: toMillimeterPoint(record.position),
    anchor_alignment: mapTextAnchor(record.justification),
    ccw_rotation: record.rotation,
    layer,
    is_mirrored: record.mirrored,
  }
}
