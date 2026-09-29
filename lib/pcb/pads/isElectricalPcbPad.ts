import type { AltiumPadRecord } from "altiumts"
import { normalizeLayer, type PcbCopperLayerMap } from "../layers"

export function isElectricalPcbPad({
  layerMap,
  record,
}: {
  layerMap: PcbCopperLayerMap
  record: AltiumPadRecord
}): boolean {
  if (!record.position) return false
  const layer = layerMap.getLayer(record.layer)
  if (!layer && normalizeLayer(record.layer) !== "MULTILAYER") return false
  return !(record.plated === false && (record.holeSizeMils ?? 0) > 0)
}
