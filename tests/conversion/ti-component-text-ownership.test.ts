import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type {
  AnyCircuitElement,
  SchematicComponent,
  SchematicText,
} from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>

test("assigns DRV8307EVM component text to its schematic component", async () => {
  const source = await readReferenceBytes(
    TI_EVM_REFERENCE_FILENAMES.drv8307Evm.schematic,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const sourceComponent = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" && element.name === "JP5",
  )
  const schematicComponent = circuitJson.find(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id === sourceComponent?.source_component_id,
  )
  const ownedText = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_component_id ===
        schematicComponent?.schematic_component_id,
  )

  expect(ownedText.map(({ text }) => text)).toEqual([
    "1",
    "2",
    "JP5",
    "Comment",
  ])
})
