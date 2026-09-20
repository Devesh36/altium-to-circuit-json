import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element, type PcbFabricationNoteText } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

const board =
  "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil"

function getFabricationNoteTexts(source: string): PcbFabricationNoteText[] {
  return convertAltiumPcbDocToCircuitJson(
    parseAltiumPcbDoc([board, source].join("\n")),
  ).filter(
    (element): element is PcbFabricationNoteText =>
      element.type === "pcb_fabrication_note_text",
  )
}

test("imports free mechanical text as a board fabrication note", () => {
  const [text] = getFabricationNoteTexts(
    "|RECORD=Text|LAYER=MECHANICAL10|X=100mil|Y=200mil|HEIGHT=40mil|ROTATION=45|JUSTIFICATION=1|MIRROR=TRUE|WIDESTRING=70,97,98,32,110,111,116,101",
  )

  expect(text).toMatchObject({
    pcb_component_id: "pcb_component_altium_board_graphics",
    text: "Fab note",
    font_size: 1.016,
    anchor_position: { x: 2.54, y: 5.08 },
    anchor_alignment: "top_left",
    ccw_rotation: 45,
    layer: "bottom",
  })
  expect(any_circuit_element.safeParse(text).success).toBe(true)
})

test("resolves component designator and comment fields", () => {
  const texts = getFabricationNoteTexts(
    [
      "|RECORD=Component|ID=0|LAYER=BOTTOM|X=100mil|Y=100mil|SOURCEDESIGNATOR=U1|SOURCECOMMENT=Controller|NAMEON=TRUE|COMMENTON=TRUE",
      "|RECORD=Text|COMPONENT=0|LAYER=MECHANICAL5|X=100mil|Y=100mil|HEIGHT=30mil|TEXT=.Designator",
      "|RECORD=Text|COMPONENT=0|LAYER=MECHANICAL5|X=100mil|Y=150mil|HEIGHT=30mil|COMMENT=TRUE|TEXT=.Comment",
    ].join("\n"),
  )

  expect(texts.map(({ text }) => text)).toEqual(["U1", "Controller"])
  expect(texts.map(({ layer }) => layer)).toEqual(["bottom", "bottom"])
  expect(texts.map(({ pcb_component_id }) => pcb_component_id)).toEqual([
    "pcb_component_altium_0",
    "pcb_component_altium_0",
  ])
})

test("omits hidden component fields but preserves other courtyard-layer text", () => {
  const texts = getFabricationNoteTexts(
    [
      "|RECORD=Component|ID=0|LAYER=TOP|X=100mil|Y=100mil|SOURCEDESIGNATOR=R1|NAMEON=FALSE",
      "|RECORD=Text|COMPONENT=0|LAYER=MECHANICAL15|X=100mil|Y=100mil|HEIGHT=30mil|DESIGNATOR=TRUE|TEXT=.Designator",
      "|RECORD=Text|LAYER=MECHANICAL16|X=200mil|Y=200mil|HEIGHT=30mil|TEXT=Assembly detail",
    ].join("\n"),
  )

  expect(texts).toHaveLength(1)
  expect(texts[0]?.text).toBe("Assembly detail")
})

test("can exclude fabrication-note text", () => {
  const document = parseAltiumPcbDoc(
    [
      board,
      "|RECORD=Text|LAYER=MECHANICAL10|X=100mil|Y=200mil|TEXT=Fab note",
    ].join("\n"),
  )

  expect(
    convertAltiumPcbDocToCircuitJson(document, {
      includeFabricationNoteText: false,
    }).some((element) => element.type === "pcb_fabrication_note_text"),
  ).toBe(false)
})
