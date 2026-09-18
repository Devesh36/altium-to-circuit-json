import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbPlatedHole } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=800mil|VY1=0mil|KIND2=0|VX2=800mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Pad|LAYER=MULTILAYER|X=250mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=RECTANGLE|ROTATION=90|LAYER0HOLEXOFFSET=30mil|LAYER0HOLEYOFFSET=10mil|PLATED=TRUE",
    "|RECORD=Pad|LAYER=MULTILAYER|X=550mil|Y=200mil|XSIZE=180mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=RECTANGLE|ROTATION=270|PADXOFFSET0=30mil|PADYOFFSET0=10mil|PLATED=TRUE",
    "|RECORD=Pad|LAYER=MIDLAYER2|X=250mil|Y=80mil|XSIZE=180mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=RECTANGLE|LAYER2HOLEXOFFSET=20mil|LAYER2HOLEYOFFSET=-5mil|PLATED=TRUE",
    "|RECORD=Pad|LAYER=INTERNALPLANE3|X=550mil|Y=80mil|XSIZE=180mil|YSIZE=100mil|HOLESIZE=40mil|SHAPE=RECTANGLE|PADXOFFSET3=-15mil|PADYOFFSET3=25mil|PLATED=TRUE",
  ].join("\n"),
)

test("preserves rotated pad hole offsets across stack layers", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const platedHoles = circuitJson.filter(
    (element): element is PcbPlatedHole => element.type === "pcb_plated_hole",
  )

  expect(platedHoles).toHaveLength(4)
  const firstHole = platedHoles[0]
  const secondHole = platedHoles[1]
  const midLayerHole = platedHoles[2]
  const internalPlaneHole = platedHoles[3]
  if (
    firstHole?.shape !== "circular_hole_with_rect_pad" ||
    secondHole?.shape !== "circular_hole_with_rect_pad" ||
    midLayerHole?.shape !== "circular_hole_with_rect_pad" ||
    internalPlaneHole?.shape !== "circular_hole_with_rect_pad"
  ) {
    throw new Error("Expected rectangular pads with circular holes")
  }
  expect(firstHole.hole_offset_x).toBeCloseTo(-0.254)
  expect(firstHole.hole_offset_y).toBeCloseTo(0.762)
  expect(secondHole.hole_offset_x).toBeCloseTo(0.254)
  expect(secondHole.hole_offset_y).toBeCloseTo(-0.762)
  expect(midLayerHole.hole_offset_x).toBeCloseTo(0.508)
  expect(midLayerHole.hole_offset_y).toBeCloseTo(-0.127)
  expect(internalPlaneHole.hole_offset_x).toBeCloseTo(-0.381)
  expect(internalPlaneHole.hole_offset_y).toBeCloseTo(0.635)

  const altiumSvg = serializeAltiumPcbToSvg(document, {
    height: 500,
    title: "Altium offset plated holes",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 500,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "Offset plated holes",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
