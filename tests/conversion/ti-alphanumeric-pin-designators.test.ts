import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element, type SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("preserves TI alphanumeric pin designators as schematic text", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/13.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const designatorTexts = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_text_id.startsWith("schematic_pin_designator_altium_"),
  )

  expect(designatorTexts.length).toBeGreaterThan(20)
  const firstA1Designator = designatorTexts.find(
    (element) => element.text === "A1",
  )
  expect(firstA1Designator?.anchor).toBe("bottom_center")
  expect(
    designatorTexts.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
