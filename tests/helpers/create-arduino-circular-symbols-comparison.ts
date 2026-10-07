import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import type { AnyCircuitElement, SchematicComponent } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "./read-reference"
import { renderImportedSchematicToSvg } from "./render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "./stack-svg-comparison"

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

export async function createArduinoMountingHoleComparison(): Promise<string> {
  const document = parseAltiumSchDoc(
    await readReferenceBytes(ARDUINO_SCHEMATIC_FILENAME),
  )
  // Convert the complete sheet, then isolate the four component bodies for a
  // readable detail alongside the separate full-sheet snapshot.
  const circuitJson = convertAltiumSchDocToCircuitJson(document, {
    centerOnSchematicSheet: false,
    schematicUnitScale: 0.05,
  })
  const ids = new Set(
    ARDUINO_CIRCULAR_COMPONENT_NAMES.slice(0, 4).map(
      (name) => findArduinoComponent(circuitJson, name).schematic_component_id,
    ),
  )
  const detail = circuitJson.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id !== undefined &&
      ids.has(element.schematic_component_id),
  )
  return stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(document, {
      width: 800,
      height: 400,
      showBorder: false,
      viewBox: { x: 1985, y: 795, width: 175, height: 85 },
    }),
    circuitJsonSvg: renderImportedSchematicToSvg(detail, {
      width: 800,
      height: 400,
      includeVersion: false,
    }),
    label: "Arduino Uno MH1-MH4 circular component bodies",
  })
}
