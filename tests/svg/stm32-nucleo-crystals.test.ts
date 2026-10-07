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
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(document, {
      documentName: filename,
      height: 600,
      width: 800,
      viewBox: { x: -25, y: -25, width: 1200, height: 850 },
      title: "altiumts source rendering",
    }),
    circuitJsonSvg,
    label: "STM32 Nucleo ST-LINK schematic",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves X1 as a crystal with both pin identities", () => {
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
