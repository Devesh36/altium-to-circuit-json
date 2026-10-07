import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { AnyCircuitElement, SchematicComponent } from "circuit-json"
import { createOpenSourceSchematicComparison } from "./create-open-source-schematic-comparison"

export const ARDUINO_SCHEMATIC_FILENAME = "arduino-uno.SchDoc"
export const ARDUINO_CIRCULAR_COMPONENT_NAMES = [
  "MH1",
  "MH2",
  "MH3",
  "MH4",
  "J8",
  "J9",
] as const

export function findArduinoComponent(
  circuitJson: AnyCircuitElement[],
  name: string,
): SchematicComponent {
  const source = circuitJson.find(
    (element) => element.type === "source_component" && element.name === name,
  )
  if (source?.type !== "source_component") {
    throw new Error(`Missing Arduino source component ${name}`)
  }
  const component = circuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === source.source_component_id,
  )
  if (component?.type !== "schematic_component") {
    throw new Error(`Missing Arduino schematic component ${name}`)
  }
  return component
}

export async function readArduinoSchematicBytes(): Promise<Uint8Array> {
  return new Uint8Array(
    await readFile(
      resolve(import.meta.dir, "../fixtures", ARDUINO_SCHEMATIC_FILENAME),
    ),
  )
}

export async function createArduinoSchematicComparison() {
  return createOpenSourceSchematicComparison({
    filename: ARDUINO_SCHEMATIC_FILENAME,
    schematicName: "Arduino Uno",
    source: await readArduinoSchematicBytes(),
  })
}
