import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbPlatedHole, PcbSmtPad } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=900mil|VY1=0mil|KIND2=0|VX2=900mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Pad|LAYER=TOP|X=200mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|SHAPE=ROUND|LAYER0ALTSHAPE=ROUNDRECT|LAYER0CORNERRADIUS=10",
    "|RECORD=Pad|LAYER=TOP|X=450mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|SHAPE=ROUND|LAYER0ALTSHAPE=ROUNDRECT|LAYER0CORNERRADIUS=100",
    "|RECORD=Pad|LAYER=MULTILAYER|X=700mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=ROUND|LAYER0ALTSHAPE=ROUNDRECT|LAYER0CORNERRADIUS=40|PLATED=TRUE",
  ].join("\n"),
)

test("preserves per-layer ROUNDRECT corner radii", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const smtPads = circuitJson.filter(
    (element): element is PcbSmtPad => element.type === "pcb_smtpad",
  )
  const platedHole = circuitJson.find(
    (element): element is PcbPlatedHole => element.type === "pcb_plated_hole",
  )

  expect(smtPads).toHaveLength(2)
  if (smtPads[0]?.shape !== "rect" || smtPads[1]?.shape !== "rect") {
    throw new Error("Expected ROUNDRECT pads to use rectangular geometry")
  }
  expect(smtPads[0].corner_radius).toBeCloseTo(0.127)
  expect(smtPads[1].corner_radius).toBeCloseTo(1.27)
  if (platedHole?.shape !== "circular_hole_with_rect_pad") {
    throw new Error("Expected a ROUNDRECT plated pad")
  }
  expect(platedHole.rect_border_radius).toBeCloseTo(0.508)

  const altiumSvg = serializeAltiumPcbToSvg(document, {
    height: 500,
    title: "Altium ROUNDRECT corner radii",
    width: 900,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 500,
    matchBoardAspectRatio: true,
    width: 900,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "ROUNDRECT corner radii",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
