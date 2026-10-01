import type { AnyCircuitElement } from "circuit-json"
import { AltiumProjectToCircuitJsonConverter } from "../project"
import type { ConvertAltiumProjectInput } from "../project/types"

export function convertAltiumProjectToCircuitJson(
  input: ConvertAltiumProjectInput,
): AnyCircuitElement[] {
  const converter = new AltiumProjectToCircuitJsonConverter(input)
  converter.runUntilFinished()
  return converter.getOutput()
}
