import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const boardRecord =
  "|RECORD=Board|VX0=0mil|VY0=0mil|VX1=5000mil|VY1=0mil|VX2=5000mil|VY2=5000mil|VX3=0mil|VY3=5000mil|VX4=0mil|VY4=0mil"
const polygonRecord =
  "|RECORD=Polygon|ID=0|LAYER=TOP|KIND0=0|VX0=500mil|VY0=500mil|KIND1=0|VX1=4500mil|VY1=500mil|KIND2=0|VX2=4500mil|VY2=4500mil|KIND3=0|VX3=500mil|VY3=4500mil|KIND4=0|VX4=500mil|VY4=500mil"
const cutoutRecord =
  "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT|KIND0=0|VX0=2000mil|VY0=2000mil|KIND1=0|VX1=3000mil|VY1=2000mil|KIND2=0|VX2=3000mil|VY2=3000mil|KIND3=0|VX3=2000mil|VY3=3000mil|KIND4=0|VX4=2000mil|VY4=2000mil|HOLECOUNT=0"
const copperRegionRecord =
  "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=COPPER|HOLECOUNT=1|KIND0=0|VX0=500mil|VY0=500mil|KIND1=0|VX1=4500mil|VY1=500mil|KIND2=0|VX2=4500mil|VY2=4500mil|KIND3=0|VX3=500mil|VY3=4500mil|KIND4=0|VX4=500mil|VY4=500mil|HOLE0COUNT=4|HOLE0VX0=2000mil|HOLE0VY0=2000mil|HOLE0VX1=3000mil|HOLE0VY1=2000mil|HOLE0VX2=3000mil|HOLE0VY2=3000mil|HOLE0VX3=2000mil|HOLE0VY3=3000mil"

test("preserves a copper polygon with a linked cutout", async () => {
  const document = parseAltiumPcbDoc(
    [boardRecord, polygonRecord, cutoutRecord].join("\n"),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const pours = circuitJson.filter(
    (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
  )

  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({ shape: "brep", layer: "top" })
  const pour = pours.find((pour) => pour.shape === "brep")
  expect(pour?.brep_shape.inner_rings).toHaveLength(1)

  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(document),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson),
    label: "Copper polygon with linked cutout",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("uses a linked copper region without duplicating the polygon", () => {
  const document = parseAltiumPcbDoc(
    [boardRecord, polygonRecord, copperRegionRecord, cutoutRecord].join("\n"),
  )
  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({ shape: "brep", layer: "top" })
})

test("resolves explicit polygon IDs for linked regions", () => {
  const explicitPolygonRecord = polygonRecord.replace("|ID=0|", "|ID=7|")
  for (const regionRecord of [cutoutRecord, copperRegionRecord]) {
    const linkedRegionRecord = regionRecord.replace(
      "|POLYGON=0|",
      "|POLYGON=7|",
    )
    const document = parseAltiumPcbDoc(
      [boardRecord, explicitPolygonRecord, linkedRegionRecord].join("\n"),
    )
    const pours = convertAltiumPcbDocToCircuitJson(document).filter(
      (element) => element.type === "pcb_copper_pour",
    )

    expect(pours).toHaveLength(1)
    expect(pours[0]?.shape).toBe("brep")
    if (pours[0]?.shape === "brep") {
      expect(pours[0].brep_shape.inner_rings).toHaveLength(1)
    }
  }
})

test("does not infer a hole from a dangling polygon reference", () => {
  const danglingCutout = cutoutRecord.replace("|POLYGON=0|", "|POLYGON=7|")
  const document = parseAltiumPcbDoc(
    [boardRecord, polygonRecord, danglingCutout].join("\n"),
  )
  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(pours).toHaveLength(1)
  expect(pours[0]?.shape).toBe("polygon")
})

test("preserves copper islands inside holed cutouts", () => {
  const holedCutoutRecord = cutoutRecord.replace(
    "|HOLECOUNT=0",
    "|HOLECOUNT=1|HOLE0COUNT=4|HOLE0VX0=2200mil|HOLE0VY0=2200mil|HOLE0VX1=2400mil|HOLE0VY1=2200mil|HOLE0VX2=2400mil|HOLE0VY2=2400mil|HOLE0VX3=2200mil|HOLE0VY3=2400mil",
  )
  for (const regionRecord of [
    holedCutoutRecord,
    holedCutoutRecord.replace("|POLYGON=0", ""),
  ]) {
    const document = parseAltiumPcbDoc(
      [boardRecord, polygonRecord, regionRecord].join("\n"),
    )
    const pours = convertAltiumPcbDocToCircuitJson(document).filter(
      (element) => element.type === "pcb_copper_pour",
    )

    expect(pours).toHaveLength(2)
    expect(pours[0]?.shape).toBe("brep")
    if (pours[0]?.shape === "brep") {
      expect(pours[0].brep_shape.inner_rings).toHaveLength(1)
    }
    expect(pours[1]).toMatchObject({ shape: "polygon", layer: "top" })
    if (pours[1]?.shape === "polygon") {
      expect(pours[1].points).toEqual([
        { x: milsToMillimeters(2200), y: milsToMillimeters(2200) },
        { x: milsToMillimeters(2400), y: milsToMillimeters(2200) },
        { x: milsToMillimeters(2400), y: milsToMillimeters(2400) },
        { x: milsToMillimeters(2200), y: milsToMillimeters(2400) },
      ])
    }
  }
})

test("ignores a linked cutout outside its polygon", () => {
  const outsideCutoutRecord =
    "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT|VX0=4600mil|VY0=2000mil|VX1=4800mil|VY1=2000mil|VX2=4800mil|VY2=3000mil|VX3=4600mil|VY3=3000mil"
  const document = parseAltiumPcbDoc(
    [boardRecord, polygonRecord, outsideCutoutRecord].join("\n"),
  )
  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({ shape: "polygon", layer: "top" })
})

test("does not make a hole from a cutout touching a concave polygon", () => {
  const concavePolygonRecord =
    "|RECORD=Polygon|LAYER=TOP|VX0=0mil|VY0=0mil|VX1=10mil|VY1=0mil|VX2=10mil|VY2=10mil|VX3=6mil|VY3=10mil|VX4=6mil|VY4=4mil|VX5=4mil|VY5=4mil|VX6=4mil|VY6=10mil|VX7=0mil|VY7=10mil"
  const touchingCutoutRecord =
    "|RECORD=Region|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT|VX0=2mil|VY0=3mil|VX1=8mil|VY1=3mil|VX2=8mil|VY2=4mil|VX3=2mil|VY3=4mil"
  const document = parseAltiumPcbDoc(
    [boardRecord, concavePolygonRecord, touchingCutoutRecord].join("\n"),
  )
  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(pours).toHaveLength(1)
  expect(pours[0]?.shape).toBe("polygon")
})
