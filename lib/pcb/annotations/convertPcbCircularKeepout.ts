import type { AltiumArcRecord } from "altiumts"
import type { PCBKeepoutCircle } from "circuit-json"
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
}): PCBKeepoutCircle[] {
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
  // Circuit JSON has no annular keepout. Keep circle centers within half a
  // stroke radius of each other so their union follows the stroked arc.
  const count = Math.max(
    8,
    Math.ceil((4 * Math.PI * centerlineRadius) / strokeRadius),
  )
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count
    return {
      type: "pcb_keepout",
      pcb_keepout_id: `${id}_${index}`,
      shape: "circle",
      center: {
        x: centerPoint.x + centerlineRadius * Math.cos(angle),
        y: centerPoint.y + centerlineRadius * Math.sin(angle),
      },
      radius: strokeRadius,
      layers,
      description: "Altium annular arc keepout",
    }
  })
}
