import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

type SchematicComponent = Extract<
  AnyCircuitElement,
  { type: "schematic_component" }
>

test("preserves pinless component graphics on the TI mounting hardware sheet", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/57.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const schematicComponents = circuitJson.filter(
    (element): element is SchematicComponent =>
      element.type === "schematic_component",
  )

  expect(sourceComponents).toHaveLength(25)
  expect(schematicComponents).toHaveLength(25)
  expect(
    schematicComponents.every(
      (component) => component.is_box_with_pins === false,
    ),
  ).toBe(true)
  const componentsWithOwnedGraphics = schematicComponents.filter((component) =>
    circuitJson.some(
      (element) =>
        element.type !== "schematic_component" &&
        "schematic_component_id" in element &&
        element.schematic_component_id === component.schematic_component_id,
    ),
  )
  expect(componentsWithOwnedGraphics).toHaveLength(20)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
