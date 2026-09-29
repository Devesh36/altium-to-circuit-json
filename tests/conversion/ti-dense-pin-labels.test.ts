import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type {
  AnyCircuitElement,
  SchematicComponent,
  SchematicPort,
} from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>

test("keeps dense TI HDMI pin labels legible", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/39.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const sourceComponent = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" && element.name === "U32",
  )
  const component = circuitJson.find(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.source_component_id === sourceComponent?.source_component_id,
  )
  const videoPins = circuitJson.filter(
    (element): element is SchematicPort =>
      element.type === "schematic_port" &&
      element.schematic_component_id === component?.schematic_component_id &&
      /^D\d+$/u.test(element.display_pin_label ?? ""),
  )

  expect(videoPins).toHaveLength(24)
  expect(
    videoPins.every(
      (pin) =>
        pin.display_pin_label_font_size !== undefined &&
        pin.display_pin_label_font_size < 0.15,
    ),
  ).toBe(true)
  expect(videoPins[0]?.display_pin_label_font_size).toBeCloseTo(0.1424575, 6)
})
