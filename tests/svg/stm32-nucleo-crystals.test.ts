import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

// MB1136 C.3 ST-LINK sheet, downloaded unchanged from:
// https://hands.com/~lkcl/stl47o/sch/MB1136C_schematic_layout/ST_LINK_V2-1.SCHDOC
const filename = "stm32-nucleo-st-link.SchDoc"
const source = new Uint8Array(
  await readFile(resolve(import.meta.dir, "../fixtures", filename)),
)
const document = parseAltiumSchDoc(source)
const circuitJson = convertAltiumToCircuitJson(source, {
  sourceType: "schematic",
  schematic: { documentName: filename, sheetName: "STM32 Nucleo ST-LINK" },
})

test("STM32 Nucleo full ST-LINK schematic source and conversion", async () => {
  // Use a larger preview frame for this sheet's off-page labels and title block.
  // Sheet dimensions are in millimeters; component and wire positions stay intact.
  const previewCircuitJson = circuitJson.map((element) =>
    element.type === "schematic_sheet"
      ? { ...element, sheet_width: 350, sheet_height: 250 }
      : element,
  )
  const circuitJsonSvg = renderImportedSchematicToSvg(previewCircuitJson)
  // The source declares a 1000-unit sheet, but its drawing extends beyond it.
  // Frame the source preview instead of changing the native document's geometry.
  const sourceViewBox = { x: -45, y: -50, width: 1260, height: 900 }
  const altiumSvg = serializeAltiumSheetToSvg(document, {
    documentName: filename,
    height: 600,
    width: 800,
    viewBox: sourceViewBox,
    showBorder: false,
    title: "altiumts source rendering (preview frame)",
  })
  const sourceFrame = `<g data-record="PreviewSheetBorder" fill="#fffef8" stroke="#334155" stroke-width="1"><rect x="20" y="20" width="${sourceViewBox.width - 40}" height="${sourceViewBox.height - 40}"/><rect x="30" y="30" width="${sourceViewBox.width - 60}" height="${sourceViewBox.height - 60}" fill="none"/></g>`
  const framedAltiumSvg = altiumSvg.replace(
    '<g data-sheet-content="true"',
    `${sourceFrame}<g data-sheet-content="true"`,
  )
  expect(framedAltiumSvg).toContain('data-record="PreviewSheetBorder"')
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: framedAltiumSvg,
    circuitJsonSvg,
    label: "STM32 Nucleo ST-LINK schematic",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test.failing("preserves X1 as a crystal with both pin identities", () => {
  const sourceComponent = circuitJson
    .filter((element) => element.type === "source_component")
    .find((element) => element.name === "X1")
  const component = circuitJson
    .filter((element) => element.type === "schematic_component")
    .find(
      (element) =>
        element.source_component_id === sourceComponent?.source_component_id,
    )
  expect([
    "crystal_left",
    "crystal_right",
    "crystal_up",
    "crystal_down",
  ]).toContain(component?.symbol_name ?? "")
  expect(sourceComponent).toMatchObject({
    ftype: "simple_crystal",
    pin_variant: "two_pin",
  })
  expect(
    circuitJson
      .filter((element) => element.type === "schematic_port")
      .filter(
        (element) =>
          element.schematic_component_id === component?.schematic_component_id,
      )
      .map((port) => port.pin_number)
      .sort(),
  ).toEqual([1, 2])
})
