import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import {
  any_circuit_element,
  type PcbFabricationNotePath,
  type PcbFabricationNoteRect,
  type PcbFabricationNoteText,
} from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const fabricationNotesDocument = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|MECHPAIR0L1=MECHANICAL5|MECHPAIR0L2=MECHANICAL6|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Track|COMPONENT=65535|LAYER=MECHANICAL5|X1=75mil|Y1=75mil|X2=625mil|Y2=75mil|WIDTH=8mil",
    "|RECORD=Arc|LAYER=MECHANICAL5|LOCATION.X=175mil|LOCATION.Y=250mil|RADIUS=75mil|STARTANGLE=0|ENDANGLE=270|WIDTH=8mil",
    "|RECORD=Fill|LAYER=MECHANICAL5|X1=300mil|Y1=175mil|X2=400mil|Y2=275mil",
    "|RECORD=Text|LAYER=MECHANICAL5|X=475mil|Y=225mil|HEIGHT=50mil|JUSTIFICATION=5|TEXT=FAB NOTE",
    "|RECORD=Track|LAYER=MECHANICAL6|X1=75mil|Y1=425mil|X2=625mil|Y2=425mil|WIDTH=8mil",
  ].join("\n"),
)

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

test("imports fabrication-note graphics and preserves paired layer sides", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(fabricationNotesDocument)
  const fabricationNotes = circuitJson.filter(
    (
      element,
    ): element is
      | PcbFabricationNotePath
      | PcbFabricationNoteRect
      | PcbFabricationNoteText =>
      element.type === "pcb_fabrication_note_path" ||
      element.type === "pcb_fabrication_note_rect" ||
      element.type === "pcb_fabrication_note_text",
  )

  expect(fabricationNotes.map((element) => element.type)).toEqual([
    "pcb_fabrication_note_path",
    "pcb_fabrication_note_path",
    "pcb_fabrication_note_rect",
    "pcb_fabrication_note_text",
    "pcb_fabrication_note_path",
  ])
  expect(fabricationNotes.map((element) => element.layer)).toEqual([
    "top",
    "top",
    "top",
    "top",
    "bottom",
  ])
  expect(fabricationNotes[0]?.pcb_component_id).toBe(
    "pcb_component_altium_board_graphics",
  )
  expect(
    fabricationNotes.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)

  const altiumSvg = serializeAltiumPcbToSvg(fabricationNotesDocument, {
    height: 800,
    title: "Altium fabrication notes source",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 800,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB fabrication notes",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
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
