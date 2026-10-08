import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

// Original MB1136 C.3 overview sheet, downloaded unchanged from:
// https://hands.com/~lkcl/stl47o/sch/MB1136C_schematic_layout/MB1136.SchDoc
const filename = "stm32-nucleo-overview.SchDoc"
const source = new Uint8Array(
  await readFile(resolve(import.meta.dir, "../fixtures", filename)),
)
const document = parseAltiumSchDoc(source)
const circuitJson = convertAltiumToCircuitJson(source, {
  sourceType: "schematic",
  schematic: { documentName: filename, sheetName: "STM32 Nucleo overview" },
})
const busIds = new Set(
  document.records.flatMap((record, index) =>
    record.recordKind === "26" ? [`schematic_path_altium_${index}`] : [],
  ),
)

test("STM32 Nucleo full overview schematic source and conversion", async () => {
  expect(busIds.size).toBe(5)
  // Display frames only: retain the native document and electrical geometry.
  const previewCircuitJson = circuitJson.map((element) =>
    element.type === "schematic_sheet"
      ? { ...element, sheet_width: 350, sheet_height: 250 }
      : element,
  )
  const circuitJsonSvg = renderImportedSchematicToSvg(previewCircuitJson)
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
    label: "STM32 Nucleo overview schematic",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves all five schematic buses with their color and thickness", () => {
  const buses = circuitJson
    .filter((element) => element.type === "schematic_path")
    .filter((path) => busIds.has(path.schematic_path_id))
  expect(buses).toHaveLength(5)
  for (const bus of buses) {
    expect(bus.points).toHaveLength(2)
    expect(bus).toMatchObject({ stroke_color: "#000080", is_filled: false })
    // The fixture's buses span 200 units and use the 3-unit bus stroke.
    const [start, end] = bus.points
    if (!start || !end) throw new Error("Missing bus endpoints")
    expect(end.y).toBeCloseTo(start.y, 8)
    const span = Math.abs(end.x - start.x)
    expect(bus.stroke_width).toBeCloseTo((span * 3) / 200, 8)
  }
})
