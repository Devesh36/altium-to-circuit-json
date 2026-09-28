import type { AltiumArcRecord } from "altiumts"
import type { PCBKeepout } from "circuit-json"
import { milsToMillimeters, toMillimeterPoint } from "../geometry"
import { isKeepoutLayer, type PcbCopperLayerMap } from "../layers"

export function convertPcbCircularKeepout({
  layerMap,
  record,
  recordIndex,
}: {
  layerMap: PcbCopperLayerMap
  record: AltiumArcRecord
  recordIndex: number
}): PCBKeepout[] {
  const center = record.center
  const radiusMils = record.radiusMils
  if (!center || !radiusMils || !record.isFullCircle) return []
  const layer = layerMap.getLayer(record.layer)
  if (!layer && !isKeepoutLayer(record.layer)) return []

  const centerPoint = toMillimeterPoint(center)
  const centerlineRadius = milsToMillimeters(radiusMils)
  const strokeRadius = milsToMillimeters(Math.max(record.widthMils ?? 0, 0) / 2)
  const layers = layer ? [layer] : layerMap.layers
  const id = `pcb_keepout_altium_arc_${recordIndex}`

  if (strokeRadius === 0 || strokeRadius >= centerlineRadius) {
    return [
      {
        type: "pcb_keepout",
        pcb_keepout_id: id,
        shape: "circle",
        center: centerPoint,
        radius: centerlineRadius + strokeRadius,
        layers,
        description: "Altium circular keepout",
      },
    ]
  }
  return [
    {
      type: "pcb_keepout",
      pcb_keepout_id: id,
      shape: "ring",
      center: centerPoint,
      inner_radius: centerlineRadius - strokeRadius,
      outer_radius: centerlineRadius + strokeRadius,
      layers,
      description: "Altium annular arc keepout",
    },
  ]
}
