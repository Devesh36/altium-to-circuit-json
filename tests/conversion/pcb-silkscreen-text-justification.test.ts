import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("maps Altium's numeric PCB text justification grid", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=900mil|VY1=0mil|KIND2=0|VX2=900mil|VY2=100mil|KIND3=0|VX3=0mil|VY3=100mil|KIND4=0|VX4=0mil|VY4=0mil",
      ...Array.from(
        { length: 9 },
        (_, index) =>
          `|RECORD=Text|LAYER=TOPOVERLAY|X=${index * 100}mil|Y=0mil|HEIGHT=30mil|JUSTIFICATION=${index + 1}|TEXT=${index + 1}`,
      ),
    ].join("\n"),
  )

  const texts = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text",
  )

  expect(texts.map((text) => text.anchor_alignment)).toEqual([
    "top_left",
    "center_left",
    "bottom_left",
    "top_center",
    "center",
    "bottom_center",
    "top_right",
    "center_right",
    "bottom_right",
  ])
})
