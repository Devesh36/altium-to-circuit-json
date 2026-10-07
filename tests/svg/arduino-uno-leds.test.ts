import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertAltiumToCircuitJson } from "../../lib"
import { classifyComponent } from "../../lib/schematic/symbols/classifyComponent"
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

test("Arduino Uno LED emission arrows source and conversion", async () => {
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumSheetToSvg(parseAltiumSchDoc(source), {
      documentName: filename,
      height: 600,
      width: 800,
      title: "altiumts source rendering",
    }),
    circuitJsonSvg,
    label: "Arduino Uno LED emission arrows",
  })
  expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves LED classification and emission-arrow symbols for D1–D4", () => {
  for (const name of ["D1", "D2", "D3", "D4"]) {
    const sourceComponent = circuitJson
      .filter((element) => element.type === "source_component")
      .find((element) => element.name === name)
    const component = circuitJson
      .filter((element) => element.type === "schematic_component")
      .find(
        (element) =>
          element.source_component_id === sourceComponent?.source_component_id,
      )
    expect(sourceComponent?.ftype).toBe("simple_led")
    expect(component?.symbol_name).toMatch(/^led_(left|right|up|down)$/u)
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "schematic_port" &&
          element.schematic_component_id === component?.schematic_component_id,
      ),
    ).toHaveLength(2)
  }
})

test("keeps the Arduino D5 Schottky component classified as a diode", () => {
  const sourceComponent = circuitJson
    .filter((element) => element.type === "source_component")
    .find((element) => element.name === "D5")
  expect(sourceComponent?.ftype).toBe("simple_diode")
})

test.each([
  ["D1", "LED SMARTLED GREEN 570NM 0603", "led"],
  ["D1", "  led orange 0603", "led"],
  ["D1", "Light-emitting diode, green", "led"],
  ["D1", "DIODE SCHOTTKY 30V 0.2A SOD323", "diode"],
  ["D1", "DIODE for LED protection", "diode"],
  ["D1", "LED driver protection diode", "diode"],
  ["D1", "LED controller protection diode", "diode"],
  ["D1", "", "diode"],
  ["R1", "LED current-limiting resistor", "resistor"],
  ["U1", "LED driver IC", "unknown"],
] as const)(
  "classifies %s with description %s as %s",
  (designator, description, expected) => {
    expect(
      classifyComponent({
        designator,
        description,
        libraryReference: "manufacturer-part-number",
      }),
    ).toBe(expected)
  },
)
