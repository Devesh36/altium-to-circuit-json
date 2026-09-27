import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicGraphic } from "circuit-json"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

const IMAGE_SHEETS = ["05", "06", "07", "08", "09", "10", "11", "15", "57"]

test("preserves all embedded TI schematic images as inline graphics", async () => {
  const graphics: SchematicGraphic[] = []

  for (const sheetNumber of IMAGE_SHEETS) {
    const source = await readReferenceBytes(
      `${TI_TMDS62LEVM_FIXTURE_NAME}/${sheetNumber}.SchDoc`,
    )
    const circuitJson = convertAltiumSchDocToCircuitJson(
      parseAltiumSchDoc(source),
    )
    const sheetGraphics = circuitJson.filter(
      (element): element is SchematicGraphic =>
        element.type === "schematic_graphic",
    )
    expect(
      sheetGraphics.every(
        (graphic) => any_circuit_element.safeParse(graphic).success,
      ),
    ).toBe(true)
    graphics.push(...sheetGraphics)
  }

  expect(graphics).toHaveLength(11)
  expect(
    graphics.every((graphic) =>
      graphic.svg_content?.includes('<image href="data:image/png;base64,'),
    ),
  ).toBe(true)
  expect(graphics[0]?.svg_content).toContain('viewBox="0 0 2020 1520"')
  expect(graphics[0]?.svg_content).toContain('x="300" y="110"')
  expect(graphics[0]?.svg_content).toContain(
    'preserveAspectRatio="xMidYMid meet"',
  )
})
