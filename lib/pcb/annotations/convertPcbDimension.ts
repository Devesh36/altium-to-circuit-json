import type { AltiumDimensionRecord } from "altiumts"
import type { PcbFabricationNoteDimension } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { getRecordLayer, mapMechanicalLayer } from "../layers"
import { BOARD_GRAPHICS_COMPONENT_ID, FABRICATION_NOTE_COLOR } from "../model"
import { getDimensionText } from "./getDimensionText"
import { getMeasurement } from "./getMeasurement"
import { getPcbDimensionProjection } from "./getPcbDimensionProjection"

export function convertPcbDimension({
  record,
  recordIndex,
}: {
  record: AltiumDimensionRecord
  recordIndex: number
}): PcbFabricationNoteDimension | undefined {
  const projection = getPcbDimensionProjection(record)
  if (!projection) return undefined
  const { axis, lengthMils, projectedEnd, referenceStart } = projection

  const perpendicular = {
    x: -axis.y,
    y: axis.x,
  }
  const lineAnchor = record.dimensionLineAnchor ?? referenceStart
  const signedOffsetMils =
    (lineAnchor.x - referenceStart.x) * perpendicular.x +
    (lineAnchor.y - referenceStart.y) * perpendicular.y
  const offsetSign = signedOffsetMils < 0 ? -1 : 1

  return {
    type: "pcb_fabrication_note_dimension",
    pcb_fabrication_note_dimension_id: `pcb_fabrication_note_dimension_altium_${recordIndex}`,
    pcb_component_id: BOARD_GRAPHICS_COMPONENT_ID,
    layer: mapMechanicalLayer(getRecordLayer(record)),
    from: toMillimeterPoint(referenceStart),
    to: toMillimeterPoint(projectedEnd),
    text: getDimensionText(record, lengthMils),
    offset_distance: milsToMillimeters(Math.abs(signedOffsetMils)),
    offset_direction: {
      x: perpendicular.x * offsetSign,
      y: perpendicular.y * offsetSign,
    },
    font: "tscircuit2024",
    font_size: milsToMillimeters(record.textHeightMils ?? 50),
    arrow_size: milsToMillimeters(getMeasurement(record, "ARROWSIZE") ?? 40),
    color: FABRICATION_NOTE_COLOR,
  }
}
