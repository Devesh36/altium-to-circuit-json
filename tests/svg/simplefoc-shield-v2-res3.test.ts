import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"

const filename = "simplefoc-shield-v2.SchDoc"
const source = new Uint8Array(
  await readFile(resolve(import.meta.dir, "../fixtures", filename)),
)
const document = parseAltiumSchDoc(source)
const circuitJson = convertAltiumToCircuitJson(source, {
  sourceType: "schematic",
  schematic: { documentName: filename, sheetName: "SimpleFOC Shield v2" },
})

test("SimpleFOC Shield v2 Res3 source and conversion, with RCS1 close-up", async () => {
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })

  const sourceFull = serializeAltiumSheetToSvg(document, {
    width: 800,
    height: 600,
  })
  const sourceFocus = serializeAltiumSheetToSvg(document, {
    width: 800,
    height: 400,
    showBorder: false,
    viewBox: { x: 1710, y: 1320, width: 210, height: 140 },
  })
  // These fixed cameras match the original reproduction, keeping the before
  // and after images comparable even when the resistor's rendered body changes.
  const importedFocus = circuitJsonSvg.replace(
    /^<svg\b[^>]*>/u,
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="575.2787905232133 79.05764817192414 100 66.6666666667">',
  )
  const comparisonSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="1100" viewBox="0 0 1640 1100" role="img" aria-label="SimpleFOC Shield v2 Res3 resistors: original Altium source on left, imported Circuit JSON on right">',
    '<rect width="1640" height="1100" fill="white"/>',
    '<g font-family="Arial" font-size="22" fill="#172230">',
    '<text x="20" y="30">Original Altium — SimpleFOC Shield v2.0.4</text>',
    '<text x="840" y="30">Imported Circuit JSON</text>',
    '<text x="20" y="675">RCS1: source zigzag resistor</text>',
    '<text x="840" y="675">RCS1: imported resistor body</text></g>',
    '<svg x="0" y="45" width="800" height="600">',
    prefixSvgIds(sourceFull, "source-full"),
    '</svg><svg x="840" y="45" width="800" height="600">',
    prefixSvgIds(circuitJsonSvg, "import-full"),
    '</svg><svg x="0" y="695" width="800" height="400">',
    prefixSvgIds(sourceFocus, "source-focus"),
    '</svg><svg x="840" y="695" width="800" height="400">',
    prefixSvgIds(importedFocus, "import-focus"),
    "</svg></svg>",
  ].join("")

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

const resistors = [
  { name: "RCS1", resistance: 0.01 },
  { name: "RCS2", resistance: 0.01 },
  { name: "PULL_A", resistance: 3300 },
  { name: "PULL_B", resistance: 3300 },
  { name: "PULL_I", resistance: 3300 },
  { name: "PULL_SCL", resistance: 4700 },
  { name: "PULL_SDA", resistance: 4700 },
]

for (const { name, resistance } of resistors) {
  test.failing(`classifies ${name} as a resistor with its resistance`, () => {
    const component = circuitJson.find(
      (element) => element.type === "source_component" && element.name === name,
    )
    expect(component).toBeDefined()
    expect(component).toMatchObject({
      ftype: "simple_resistor",
      resistance,
    })
  })
}

for (const name of [
  ...resistors.map((resistor) => resistor.name),
  "R1",
  "R2",
]) {
  test.failing(`preserves ${name}'s Res3 zigzag and terminals`, () => {
    const sourceComponent = circuitJson.find(
      (element) => element.type === "source_component" && element.name === name,
    )
    if (sourceComponent?.type !== "source_component")
      throw new Error(`Missing ${name}`)
    const component = circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.source_component_id === sourceComponent.source_component_id,
    )
    if (component?.type !== "schematic_component")
      throw new Error(`Missing ${name} symbol`)
    expect(component.is_box_with_pins).toBe(false)
    expect(component.symbol_name).toBeUndefined()
    const owned = circuitJson.filter(
      (element) =>
        "schematic_component_id" in element &&
        element.schematic_component_id === component.schematic_component_id,
    )
    expect(
      owned.filter(
        (element) =>
          element.type === "schematic_path" && element.points.length === 7,
      ),
    ).toHaveLength(1)
    expect(
      owned.filter((element) => element.type === "schematic_port"),
    ).toHaveLength(2)
  })
}

function prefixSvgIds(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/gu, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/gu, `url(#${prefix}-$1)`)
    .replace(/\bhref="#([^"]+)"/gu, `href="#${prefix}-$1"`)
}
