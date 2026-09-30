import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("SimpleFOC Mini preserves its custom schematic sheet aspect ratio", async () => {
  const source = await readReferenceBytes("simplefocmini-2024-04-26.SchDoc")
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const sheet = circuitJson.find(
    (element) => element.type === "schematic_sheet",
  )

  expect(sheet?.type).toBe("schematic_sheet")
  if (sheet?.type !== "schematic_sheet") return
  expect(sheet.sheet_width).toBeNumber()
  expect(sheet.sheet_height).toBeNumber()
  expect((sheet.sheet_width ?? 0) / (sheet.sheet_height ?? 1)).toBeCloseTo(
    761 / 463,
  )
})
