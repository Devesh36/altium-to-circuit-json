import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicComponent } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("preserves the TI RJ45 integrated magnetics body", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/32.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const component = circuitJson.find(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id === "source_component_altium_3801",
  )
  const ownedElements = circuitJson.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id === component?.schematic_component_id,
  )

  expect(component?.is_box_with_pins).toBe(false)
  expect(
    ownedElements.filter((element) => element.type === "schematic_line"),
  ).toHaveLength(243)
  expect(
    ownedElements.filter((element) => element.type === "schematic_path"),
  ).toHaveLength(105)
  expect(
    ownedElements.filter((element) => element.type === "schematic_circle"),
  ).toHaveLength(42)
  expect(
    circuitJson.filter(
      (element) =>
        element.type === "schematic_text" &&
        /^schematic_text_altium_42(?:0[9]|1\d|2[0-4])$/u.test(
          element.schematic_text_id,
        ),
    ),
  ).toHaveLength(16)
})
