import type { AltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { AltiumToCircuitJsonConverter } from "../converter"
import type { ConvertAltiumSchDocOptions } from "./types"

export function convertAltiumSchDocToCircuitJson(
  document: AltiumSchDoc,
  options: ConvertAltiumSchDocOptions = {},
): AnyCircuitElement[] {
  const { idPrefix, ...schematicOptions } = options
  const converter = new AltiumToCircuitJsonConverter(document, {
    idPrefix,
    schematic: schematicOptions,
  })
  converter.runUntilFinished()
  return converter.getOutput()
}
