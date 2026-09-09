import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const copperAreaPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Polygon|LAYER=BOTTOM|NET=0|KIND0=0|VX0=400mil|VY0=50mil|KIND1=0|VX1=650mil|VY1=50mil|KIND2=0|VX2=650mil|VY2=200mil|KIND3=0|VX3=400mil|VY3=200mil|KIND4=0|VX4=400mil|VY4=50mil",
    "|RECORD=Region|LAYER=TOP|REGIONKIND=COPPER|NET=0|HOLECOUNT=1|KIND0=0|VX0=50mil|VY0=50mil|KIND1=0|VX1=350mil|VY1=50mil|KIND2=0|VX2=350mil|VY2=300mil|KIND3=0|VX3=50mil|VY3=300mil|KIND4=0|VX4=50mil|VY4=50mil|HOLE0COUNT=4|HOLE0VX0=150mil|HOLE0VY0=125mil|HOLE0VX1=250mil|HOLE0VY1=125mil|HOLE0VX2=250mil|HOLE0VY2=225mil|HOLE0VX3=150mil|HOLE0VY3=225mil",
    "|RECORD=Fill|LAYER=MID-LAYER1|NET=0|X1=400mil|Y1=250mil|X2=650mil|Y2=450mil|ROTATION=15",
  ].join("\n"),
)

test("imports Altium copper polygons, regions, and fills", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(copperAreaPcbDoc)
  const copperPours = circuitJson.filter(
    (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
  )

  expect(copperPours.map(({ layer, shape }) => ({ layer, shape }))).toEqual([
    { layer: "bottom", shape: "polygon" },
    { layer: "top", shape: "brep" },
    { layer: "inner1", shape: "rect" },
  ])
  const region = copperPours.find((pour) => pour.shape === "brep")
  expect(region?.brep_shape.inner_rings).toHaveLength(1)

  const altiumSvg = serializeAltiumPcbToSvg(copperAreaPcbDoc, {
    height: 800,
    title: "Altium copper area source",
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
    label: "PCB copper areas",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
