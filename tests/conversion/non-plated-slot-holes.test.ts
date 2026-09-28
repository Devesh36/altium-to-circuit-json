import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("preserves a non-plated slot instead of converting it to a circle", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|SHEETWIDTH=600mil|SHEETHEIGHT=400mil",
      "|RECORD=Pad|NAME=NPTH1|LAYER=MULTILAYER|X=200mil|Y=200mil|XSIZE=100mil|YSIZE=100mil|SHAPE=ROUND|HOLESIZE=40mil|HOLETYPE=2|HOLESHAPE=SLOT|SLOTLENGTH=100mil|PLATED=FALSE",
    ].join("\n"),
  )

  const holes = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_hole",
  )

  expect(holes).toEqual([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_altium_1",
      hole_shape: "pill",
      hole_width: 2.54,
      hole_height: 1.016,
      x: 5.08,
      y: 5.08,
    },
  ])
})
