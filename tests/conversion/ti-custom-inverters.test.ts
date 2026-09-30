import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { findDetachedSymbolPortIds } from "../helpers/find-detached-symbol-ports"
import { readReferenceBytes } from "../helpers/read-reference"

test.each([
  ["41", "U7"],
  ["56", "U94"],
])("preserves the custom inverter on sheet %s (%s)", async (sheet, name) => {
  const document = parseAltiumSchDoc(
    await readReferenceBytes(`${TI_TMDS62LEVM_FIXTURE_NAME}/${sheet}.SchDoc`),
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  const source = circuitJson.find(
    (element) => element.type === "source_component" && element.name === name,
  )
  if (source?.type !== "source_component") throw new Error(`Missing ${name}`)
  const component = circuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === source.source_component_id,
  )
  if (component?.type !== "schematic_component") {
    throw new Error(`Missing ${name} schematic component`)
  }
  expect(component.is_box_with_pins).toBe(false)
  expect(component.symbol_name).toBeUndefined()

  const owned = circuitJson.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id === component.schematic_component_id,
  )
  // Six original body strokes include the closed triangle and supply leads.
  expect(
    owned.filter(
      (element) =>
        element.type === "schematic_line" &&
        element.schematic_line_id.endsWith("_line"),
    ),
  ).toHaveLength(6)
  expect(
    owned.filter(
      (element) =>
        element.type === "schematic_line" &&
        element.schematic_line_id.endsWith("_pin"),
    ),
  ).toHaveLength(5)
  expect(
    owned.filter((element) => element.type === "schematic_circle"),
  ).toHaveLength(1)
  const ports = owned.filter((element) => element.type === "schematic_port")
  expect(ports).toHaveLength(5)
  expect(ports.map((port) => port.pin_number).sort()).toEqual([1, 2, 3, 4, 5])
  expect(ports.every((port) => port.display_pin_label === undefined)).toBe(true)
  expect(ports.find((port) => port.pin_number === 4)).toMatchObject({
    is_drawn_with_inversion_circle: true,
  })
  for (const port of ports) {
    const numericLabel = circuitJson.find(
      (element) =>
        element.type === "schematic_text" &&
        element.schematic_text_id ===
          port.schematic_port_id.replace(
            "schematic_port_",
            "schematic_pin_designator_",
          ),
    )
    expect(numericLabel).toMatchObject({ text: String(port.pin_number) })
  }
  expect(findDetachedSymbolPortIds(circuitJson)).toEqual([])
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)

  const withoutText = convertAltiumSchDocToCircuitJson(document, {
    includeText: false,
  })
  expect(
    withoutText.some(
      (element) =>
        element.type === "schematic_text" &&
        element.schematic_text_id.startsWith("schematic_pin_designator_"),
    ),
  ).toBe(false)
  expect(
    withoutText.filter(
      (element) =>
        element.type === "schematic_circle" &&
        element.schematic_component_id === component.schematic_component_id,
    ),
  ).toHaveLength(1)
})
