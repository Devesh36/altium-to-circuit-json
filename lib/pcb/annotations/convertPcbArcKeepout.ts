import { type AltiumArcRecord, approximateAltiumArc } from "altiumts"
import type { PCBKeepout } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { isKeepoutLayer, type PcbCopperLayerMap } from "../layers"

export function convertPcbArcKeepout({
  layerMap,
  record,
  recordIndex,
}: {
  layerMap: PcbCopperLayerMap
  record: AltiumArcRecord
  recordIndex: number
}): PCBKeepout | undefined {
  const center = record.center
  const radiusMils = record.radiusMils
  if (!center || !radiusMils) return undefined

  const rawSweepDegrees = record.endAngle - record.startAngle
  const isFullCircle = rawSweepDegrees === 0 || Math.abs(rawSweepDegrees) >= 360

  // An arc on Altium's dedicated keepout layer has historically represented a
  // filled circular keepout in Circuit JSON. Preserve that behavior.
  if (isKeepoutLayer(record.layer)) {
    if (!isFullCircle) return undefined
    return {
      type: "pcb_keepout",
      pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
      shape: "circle",
      center: toMillimeterPoint(center),
      radius: milsToMillimeters(radiusMils + (record.widthMils ?? 0) / 2),
      layers: layerMap.layers,
      description: "Altium circular keepout",
    }
  }

  const layer = layerMap.getLayer(record.layer)
  if (!layer) return undefined
  const outline = approximateAltiumArc({
    center,
    radius: radiusMils,
    startAngleDegrees: record.startAngle,
    endAngleDegrees: record.endAngle,
  }).map(toMillimeterPoint)
  if (outline.length < 2) return undefined

  return {
    type: "pcb_keepout",
    pcb_keepout_id: `pcb_keepout_altium_arc_${recordIndex}`,
    shape: "outline",
    outline,
    stroke_width: milsToMillimeters(record.widthMils ?? 4),
    layers: [layer],
    description: "Altium arc keepout",
  }
}
