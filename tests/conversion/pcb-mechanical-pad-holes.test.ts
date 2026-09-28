import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("does not turn mechanical-layer pad graphics into drilled holes", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|SHEETWIDTH=500mil|SHEETHEIGHT=300mil",
      "|RECORD=Pad|LAYER=MULTILAYER|X=150mil|Y=150mil|XSIZE=103mil|YSIZE=103mil|SHAPE=ROUND|HOLESIZE=108mil|PLATED=FALSE",
      "|RECORD=Pad|LAYER=MECHANICAL3|X=150mil|Y=150mil|XSIZE=216.54mil|YSIZE=216.54mil|SHAPE=ROUND|HOLESIZE=216.54mil|PLATED=TRUE",
      "|RECORD=Pad|LAYER=MECHANICAL9|X=150mil|Y=150mil|XSIZE=216.54mil|YSIZE=216.54mil|SHAPE=ROUND|HOLESIZE=216.54mil|PLATED=TRUE",
      "|RECORD=Pad|LAYER=MECHANICAL16|X=250mil|Y=150mil|XSIZE=80mil|YSIZE=80mil|SHAPE=ROUND|HOLESIZE=40mil|PLATED=FALSE",
      "|RECORD=Pad|LAYER=MULTILAYER|X=350mil|Y=150mil|XSIZE=90mil|YSIZE=90mil|SHAPE=ROUND|HOLESIZE=40mil|PLATED=TRUE",
    ].join("\n"),
  )

  const holes = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) =>
      element.type === "pcb_hole" || element.type === "pcb_plated_hole",
  )

  expect(holes).toEqual([
    expect.objectContaining({
      type: "pcb_hole",
      hole_diameter: 2.7432,
    }),
    expect.objectContaining({
      type: "pcb_plated_hole",
      hole_diameter: 1.016,
    }),
  ])
})
