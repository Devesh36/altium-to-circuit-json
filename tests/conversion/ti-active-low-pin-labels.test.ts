import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicPort, SourcePort } from "circuit-json"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("preserves partially active-low TI pin labels", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/25.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const sourcePort = circuitJson.find(
    (element): element is SourcePort =>
      element.type === "source_port" && element.name === String.raw`W\P\/IO2`,
  )
  const schematicPort = circuitJson.find(
    (element): element is SchematicPort =>
      element.type === "schematic_port" &&
      element.source_port_id === sourcePort?.source_port_id,
  )

  expect(schematicPort?.display_pin_label).toBe("WP/IO2")
  expect(schematicPort?.display_pin_label_text_parts).toEqual([
    { is_overlined: true, text: "WP" },
    { text: "/IO2" },
  ])
  expect(any_circuit_element.safeParse(schematicPort).success).toBe(true)
})
