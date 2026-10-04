import type { AltiumTextRecord } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { getPcbComponentIdForRecord } from "../identifiers"
import { mapOverlayLayer } from "../layers"
import type { PcbConversionContext } from "../model"
import { mapTextAnchor } from "../text"
import { resolvePcbTextSpecialStrings } from "../text/resolvePcbTextSpecialStrings"

export function convertPcbSilkscreenText({
  context,
  record,
  recordIndex,
}: {
  context: PcbConversionContext
  record: AltiumTextRecord
  recordIndex: number
}): PcbSilkscreenText | undefined {
  if (!record.position || !record.text) return undefined

  const { document, layerMap, options } = context
  const component = document.getComponentForRecord(record)
  const specialString = record.text.trim().toLowerCase()
  const componentText =
    specialString === ".designator"
      ? component?.designator
      : specialString === ".comment"
        ? component?.comment
        : record.text
  const text = resolvePcbTextSpecialStrings({
    layer: record.layer,
    layerMap,
    project: options.project,
    text: componentText ?? "",
  })
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
