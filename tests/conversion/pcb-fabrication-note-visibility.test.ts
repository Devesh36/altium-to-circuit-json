import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("mechanical fills remain independent of silkscreen visibility", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VERSION=5.0",
      "|RECORD=Fill|LAYER=MECHANICAL1|X1=0mil|Y1=0mil|X2=100mil|Y2=100mil",
      "|RECORD=Fill|LAYER=TOPOVERLAY|X1=0mil|Y1=0mil|X2=100mil|Y2=100mil",
    ].join("\n"),
  )
  const types = (options = {}) =>
    convertAltiumPcbDocToCircuitJson(document, {
      includeBoardOutline: false,
      ...options,
    }).map((element) => element.type)

  expect(types()).toEqual(["pcb_fabrication_note_rect", "pcb_silkscreen_rect"])
  expect(types({ includeSilkscreen: false })).toEqual([
    "pcb_fabrication_note_rect",
  ])
  expect(types({ includeFabricationNotes: false })).toEqual([
    "pcb_silkscreen_rect",
  ])
  expect(
    types({ includeSilkscreen: false, includeFabricationNotes: false }),
  ).toEqual([])
})
