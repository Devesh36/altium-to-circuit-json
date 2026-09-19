import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element, type PcbFabricationNoteText } from "circuit-json"
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

test("maps nine-point Altium text anchors to supported fabrication-note anchors", () => {
  const textRecords = Array.from(
    { length: 9 },
    (_, index) =>
      `|RECORD=Text|LAYER=MECHANICAL1|X=${index * 100}mil|Y=0mil|HEIGHT=30mil|JUSTIFICATION=${index + 1}|TEXT=${index + 1}`,
  )
  const document = parseAltiumPcbDoc(
    ["|RECORD=Board|VERSION=5.0", ...textRecords].join("\n"),
  )
  const texts = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbFabricationNoteText =>
      element.type === "pcb_fabrication_note_text",
  )

  expect(texts.map((text) => text.anchor_alignment)).toEqual([
    "top_left",
    "center",
    "bottom_left",
    "center",
    "center",
    "center",
    "top_right",
    "center",
    "bottom_right",
  ])
  expect(
    texts.every((text) => any_circuit_element.safeParse(text).success),
  ).toBe(true)
})
