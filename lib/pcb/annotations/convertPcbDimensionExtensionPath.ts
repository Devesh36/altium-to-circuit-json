import type { AltiumDimensionRecord } from "altiumts"
import type { PcbFabricationNotePath } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { getRecordLayer, mapMechanicalLayer } from "../layers"
import { BOARD_GRAPHICS_COMPONENT_ID, FABRICATION_NOTE_COLOR } from "../model"
import { getPcbDimensionProjection } from "./getPcbDimensionProjection"

const REFERENCE_ALIGNMENT_TOLERANCE_MILS = 1e-6

export function convertPcbDimensionExtensionPath({
  record,
  recordIndex,
}: {
  record: AltiumDimensionRecord
  recordIndex: number
}): PcbFabricationNotePath | undefined {
  const projection = getPcbDimensionProjection(record)
  if (!projection) return undefined
  const { projectedEnd, referenceEnd } = projection
  const referenceGapMils = Math.hypot(
    referenceEnd.x - projectedEnd.x,
    referenceEnd.y - projectedEnd.y,
  )
  if (referenceGapMils <= REFERENCE_ALIGNMENT_TOLERANCE_MILS) return undefined

  return {
    type: "pcb_fabrication_note_path",
    pcb_fabrication_note_path_id: `pcb_fabrication_note_path_altium_dimension_${recordIndex}_reference_extension`,
    pcb_component_id: BOARD_GRAPHICS_COMPONENT_ID,
    layer: mapMechanicalLayer(getRecordLayer(record)),
    route: [referenceEnd, projectedEnd].map(toMillimeterPoint),
    stroke_width: milsToMillimeters(record.lineWidthMils ?? 8),
    color: FABRICATION_NOTE_COLOR,
  }
}
