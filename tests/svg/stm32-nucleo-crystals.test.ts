import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  AltiumSchComponentRecord,
  AltiumSchLineRecord,
  parseAltiumSchDoc,
  serializeAltiumSheetToSvg,
} from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { classifyComponent } from "../../lib/schematic/symbols/classifyComponent"
import { convertSingleSchematicComponent } from "../helpers/convert-single-schematic-component"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

// MB1136 C.3 MCU sheet, downloaded unchanged from:
// https://hands.com/~lkcl/stl47o/sch/MB1136C_schematic_layout/MCU_64.SchDoc
// SHA-256: 537b23d472639d557d9554b1884f71fb1a0b2e21f24afa19e001e5eb15789e6d
const filename = "stm32-nucleo-mcu.SchDoc"
const source = new Uint8Array(
  await readFile(resolve(import.meta.dir, "../fixtures", filename)),
)
const document = parseAltiumSchDoc(source)
const circuitJson = convertAltiumToCircuitJson(source, {
  sourceType: "schematic",
  schematic: { documentName: filename, sheetName: "STM32 Nucleo MCU" },
})

test("STM32 Nucleo full MCU schematic source and conversion", async () => {
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(document, {
      documentName: filename,
      height: 600,
      width: 800,
      title: "altiumts source rendering",
    }),
    circuitJsonSvg,
    label: "STM32 Nucleo MCU schematic",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves X2 crystal graphics and all four pins", () => {
  const sourceComponent = circuitJson
    .filter((element) => element.type === "source_component")
    .find((element) => element.name === "X2")
  const component = circuitJson
    .filter((element) => element.type === "schematic_component")
    .find(
      (element) =>
        element.source_component_id === sourceComponent?.source_component_id,
    )
  const crystalRecord = document.records.find(
    (record) =>
      record instanceof AltiumSchComponentRecord &&
      record.libraryReference === "MC306",
  )
  expect(crystalRecord).toBeDefined()
  if (!crystalRecord) throw new Error("Missing native X2 crystal")
  const crystalLines = document.index
    .getOwnedRecords(crystalRecord)
    .filter((record) => record instanceof AltiumSchLineRecord)

  expect(component?.is_box_with_pins).toBe(false)
  expect(component?.symbol_name).toBeUndefined()
  expect(crystalLines).toHaveLength(8)
  for (const line of crystalLines) {
    expect(
      circuitJson.find(
        (element) =>
          element.type === "schematic_line" &&
          element.schematic_line_id ===
            `schematic_line_altium_${document.records.indexOf(line)}_line` &&
          element.schematic_component_id === component?.schematic_component_id,
      ),
    ).toBeDefined()
  }
  expect(
    circuitJson
      .filter((element) => element.type === "schematic_port")
      .filter(
        (element) =>
          element.schematic_component_id === component?.schematic_component_id,
      )
      .map((port) => port.pin_number)
      .sort(),
  ).toEqual([1, 2, 3, 4])
})

test("recognizes the XTAL library used by Nucleo X1", () => {
  expect(
    classifyComponent({ designator: "X1", libraryReference: "XTAL" }),
  ).toBe("crystal")
  const crystal = convertSingleSchematicComponent({
    comment: "8MHz",
    displayText: "8MHz",
    designator: "X1",
    libraryReference: "XTAL",
  })
  const component = crystal.find(
    (element) => element.type === "schematic_component",
  )
  expect([
    "crystal_left",
    "crystal_right",
    "crystal_up",
    "crystal_down",
  ]).toContain(component?.symbol_name ?? "")
  expect(
    crystal.filter((element) => element.type === "schematic_port"),
  ).toHaveLength(2)
})
