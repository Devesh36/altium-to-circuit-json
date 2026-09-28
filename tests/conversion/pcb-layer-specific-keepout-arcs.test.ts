import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { getPcbBoardViewport } from "../helpers/filter-pcb-layer"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Arc|LAYER=TOP|KEEPOUT=TRUE|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=80mil|STARTANGLE=0|ENDANGLE=360|WIDTH=30mil",
  ].join("\n"),
)

test("snapshot: top-layer annular keepout stays out of copper", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document, {
      width: 500,
      height: 500,
      layers: ["TOP"],
      viewBox: { x: 0, y: 0, width: 500, height: 500 },
    }),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson, {
      width: 500,
      height: 500,
      layer: "top",
      viewport: getPcbBoardViewport(circuitJson),
      matchBoardAspectRatio: true,
    }),
    label: "Top-layer annular keepout",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("keeps the arc out of copper and leaves its center clear", () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  )

  expect(
    circuitJson.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(0)
  expect(keepouts).toHaveLength(1)
  const keepout = keepouts[0]
  if (keepout?.shape !== "ring") {
    throw new Error("Expected ring keepout")
  }
  expect(keepout.layers).toEqual(["top"])
  expect(keepout.inner_radius).toBeCloseTo(1.651)
  expect(keepout.outer_radius).toBeCloseTo(2.413)
})
