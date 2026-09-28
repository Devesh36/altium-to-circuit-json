import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VX0=0mil|VY0=0mil|VX1=600mil|VY1=0mil|VX2=600mil|VY2=400mil|VX3=0mil|VY3=400mil|VX4=0mil|VY4=0mil",
    "|RECORD=Pad|NAME=NPTH1|LAYER=MULTILAYER|X=200mil|Y=200mil|XSIZE=100mil|YSIZE=100mil|SHAPE=ROUND|HOLESIZE=40mil|HOLETYPE=2|HOLESHAPE=SLOT|SLOTLENGTH=100mil|PLATED=FALSE",
    "|RECORD=Pad|NAME=NPTH2|LAYER=MULTILAYER|X=400mil|Y=200mil|XSIZE=100mil|YSIZE=100mil|SHAPE=ROUND|HOLESIZE=40mil|HOLETYPE=2|HOLESHAPE=SLOT|SLOTLENGTH=100mil|ROTATION=15|HOLEROTATION=30|PLATED=FALSE",
    "|RECORD=Pad|NAME=NPTH3|LAYER=MULTILAYER|X=300mil|Y=300mil|XSIZE=50mil|YSIZE=50mil|SHAPE=ROUND|HOLESIZE=40mil|PLATED=FALSE",
  ].join("\n"),
)

test("snapshot: non-plated slots retain their shape", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson),
    label: "Non-plated Altium slot",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("preserves non-plated slot size and rotation", () => {
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
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_altium_2",
      hole_shape: "rotated_pill",
      hole_width: 2.54,
      hole_height: 1.016,
      ccw_rotation: 45,
      x: 10.16,
      y: 5.08,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_altium_3",
      hole_shape: "circle",
      hole_diameter: 1.016,
      x: 7.62,
      y: 7.62,
    },
  ])
})
