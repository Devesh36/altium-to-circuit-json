import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import {
  any_circuit_element,
  type SchematicPath,
  type SchematicPort,
} from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("preserves TI clock and inversion pin-edge symbols", async () => {
  const clockSource = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/50.SchDoc`,
  )
  const clockCircuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(clockSource),
  )
  const clockSymbols = clockCircuitJson.filter(
    (element): element is SchematicPath =>
      element.type === "schematic_path" &&
      element.schematic_path_id.startsWith("schematic_pin_clock_altium_"),
  )

  expect(clockSymbols).toHaveLength(4)
  expect(
    clockSymbols.every(
      (element) =>
        element.points.length === 4 &&
        element.schematic_component_id !== undefined &&
        element.points[0]?.x === element.points.at(-1)?.x &&
        element.points[0]?.y === element.points.at(-1)?.y,
    ),
  ).toBe(true)

  const inversionSource = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/41.SchDoc`,
  )
  const inversionCircuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(inversionSource),
  )
  const inversionPorts = inversionCircuitJson.filter(
    (element): element is SchematicPort =>
      element.type === "schematic_port" &&
      element.is_drawn_with_inversion_circle === true,
  )

  expect(inversionPorts).toHaveLength(1)
  expect(
    [...clockSymbols, ...inversionPorts].every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
