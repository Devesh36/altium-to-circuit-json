import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const filename = "arduino-uno.SchDoc"
const source = new Uint8Array(
  await readFile(resolve(import.meta.dir, "../fixtures", filename)),
)
const circuitJson = convertAltiumToCircuitJson(source, {
  sourceType: "schematic",
  schematic: { documentName: filename, sheetName: "Arduino Uno" },
})

test("Arduino Uno full schematic source and conversion", async () => {
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(parseAltiumSchDoc(source), {
      documentName: filename,
      height: 600,
      width: 800,
      title: "altiumts source rendering",
    }),
    circuitJsonSvg,
    label: "Arduino Uno schematic",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves all six Arduino circular component bodies", () => {
  for (const name of ["MH1", "MH2", "MH3", "MH4", "J8", "J9"]) {
    const sourceComponent = circuitJson
      .filter((element) => element.type === "source_component")
      .find((element) => element.name === name)
    const component = circuitJson
      .filter((element) => element.type === "schematic_component")
      .find(
        (element) =>
          element.source_component_id === sourceComponent?.source_component_id,
      )
    expect(component?.is_box_with_pins).toBe(false)
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "schematic_circle" &&
          element.schematic_component_id === component?.schematic_component_id,
      ),
    ).toHaveLength(1)
  }
})
