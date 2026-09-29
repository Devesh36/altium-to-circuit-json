import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicPath, SchematicRect, SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("HERON PAY-SSM preserves hierarchical sheet symbols", async () => {
  const source = await readReferenceBytes("heron-pay-ssm-top.SchDoc")
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
    { centerOnSchematicSheet: false, schematicUnitScale: 0.01 },
  )
  const circuitJsonWithoutText = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
    {
      centerOnSchematicSheet: false,
      includeText: false,
      schematicUnitScale: 0.01,
    },
  )
  const mcuBody = circuitJson.find(
    (element): element is SchematicRect =>
      element.type === "schematic_rect" &&
      element.schematic_rect_id === "schematic_sheet_symbol_altium_61",
  )
  const txcanEntry = circuitJson.find(
    (element): element is SchematicPath =>
      element.type === "schematic_path" &&
      element.schematic_path_id === "schematic_sheet_entry_altium_72",
  )
  const captions = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      ["schematic_text_altium_42", "schematic_text_altium_43"].includes(
        element.schematic_text_id,
      ),
  )

  expect(mcuBody).toMatchObject({
    width: 1.6,
    height: 2.5,
    color: "#840000",
    fill_color: "#ffffc2",
    is_filled: true,
  })
  expect(mcuBody?.center.x).toBeCloseTo(1.8, 12)
  expect(mcuBody?.center.y).toBeCloseTo(6.35, 12)
  expect(txcanEntry?.points).toHaveLength(3)
  expect(txcanEntry?.points[0]?.x).toBeCloseTo(2.6, 12)
  expect(txcanEntry?.points[0]?.y).toBeCloseTo(7.54, 12)
  expect(txcanEntry?.points[1]?.x).toBeCloseTo(2.53, 12)
  expect(txcanEntry?.points[1]?.y).toBeCloseTo(7.5, 12)
  expect(txcanEntry?.points[2]?.x).toBeCloseTo(2.6, 12)
  expect(txcanEntry?.points[2]?.y).toBeCloseTo(7.46, 12)
  expect(captions.map((element) => element.text)).toEqual([
    "CAN_Transciever",
    "can-SN65HVD233.SchDoc",
  ])
  expect(
    circuitJsonWithoutText.some(
      (element) =>
        element.type === "schematic_text" &&
        element.schematic_text_id.startsWith("schematic_sheet_entry_text_"),
    ),
  ).toBe(false)
  expect(
    circuitJsonWithoutText.some(
      (element) =>
        element.type === "schematic_path" &&
        element.schematic_path_id === "schematic_sheet_entry_altium_72",
    ),
  ).toBe(true)
})
