import type { AltiumDimensionRecord } from "altiumts"
import type {
  PcbFabricationNoteDimension,
  PcbFabricationNotePath,
} from "circuit-json"
import { convertPcbDimension } from "./convertPcbDimension"
import { convertPcbDimensionExtensionPath } from "./convertPcbDimensionExtensionPath"

export function convertPcbDimensionElements({
  record,
  recordIndex,
}: {
  record: AltiumDimensionRecord
  recordIndex: number
}): Array<PcbFabricationNoteDimension | PcbFabricationNotePath> {
  const dimension = convertPcbDimension({ record, recordIndex })
  if (!dimension) return []
  const extensionPath = convertPcbDimensionExtensionPath({
    record,
    recordIndex,
  })
  return extensionPath ? [dimension, extensionPath] : [dimension]
}
