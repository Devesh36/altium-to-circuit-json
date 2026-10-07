import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("assigns TI no-ERC markers to their schematic components", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/12.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )

  expect(
    circuitJson.find(
      (element) =>
        element.type === "schematic_port" &&
        element.schematic_port_id === "schematic_port_altium_553",
    ),
  ).toMatchObject({
    schematic_component_id: "schematic_component_altium_550",
  })
  expect(
    circuitJson.filter(
      (element) =>
        element.type === "schematic_line" &&
        [
          "schematic_line_altium_2586_a",
          "schematic_line_altium_2586_b",
        ].includes(element.schematic_line_id),
    ),
  ).toEqual([
    expect.objectContaining({
      schematic_line_id: "schematic_line_altium_2586_a",
      schematic_component_id: "schematic_component_altium_550",
    }),
    expect.objectContaining({
      schematic_line_id: "schematic_line_altium_2586_b",
      schematic_component_id: "schematic_component_altium_550",
    }),
  ])
  expect(
    circuitJson.find(
      (element) =>
        element.type === "schematic_port" &&
        element.schematic_port_id === "schematic_port_altium_1232",
    ),
  ).toMatchObject({
    schematic_component_id: "schematic_component_altium_1169",
  })
  expect(
    circuitJson.filter(
      (element) =>
        element.type === "schematic_line" &&
        [
          "schematic_line_altium_2598_a",
          "schematic_line_altium_2598_b",
        ].includes(element.schematic_line_id),
    ),
  ).toEqual([
    expect.objectContaining({
      schematic_line_id: "schematic_line_altium_2598_a",
      schematic_component_id: "schematic_component_altium_1169",
    }),
    expect.objectContaining({
      schematic_line_id: "schematic_line_altium_2598_b",
      schematic_component_id: "schematic_component_altium_1169",
    }),
  ])
})
