import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { getAltiumSheetDimensions } from "../../lib/schematic/document"
import { readReferenceBytes } from "../helpers/read-reference"

test("HERON standard sheet style controls the imported page dimensions", async () => {
  const source = await readReferenceBytes("heron-pay-ssm-top.SchDoc")
  const document = parseAltiumSchDoc(source)
  const sheetRecord = document.records.find(
    (record) => record.recordKind === "31",
  )

  expect(getAltiumSheetDimensions(sheetRecord)).toEqual({
    width: 1550,
    height: 1110,
  })

  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  const group = circuitJson.find(
    (element) => element.type === "schematic_group",
  )
  expect(group?.type).toBe("schematic_group")
  if (group?.type !== "schematic_group") return
  expect(group.width / group.height).toBeCloseTo(1550 / 1110)
})
