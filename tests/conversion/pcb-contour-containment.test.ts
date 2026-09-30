import { expect, test } from "bun:test"
import {
  AltiumRegionRecord,
  getPcbContour,
  getPcbRegionGeometry,
  parseAltiumPcbDoc,
} from "altiumts"
import { isContourInsideContour } from "../../lib/pcb/copperAreas/isContourInsideContour"

function getContours(cutoutStartXMils: number) {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VX0=0mil|VY0=0mil|VX1=1mil|VY1=0mil|VX2=1mil|VY2=1mil|VX3=0mil|VY3=1mil",
      "|RECORD=Polygon|LAYER=TOP|VX0=0.1mil|VY0=0.1mil|VX1=0.3mil|VY1=0.2mil|VX2=0.5mil|VY2=0.2mil|VX3=0.5mil|VY3=0.1mil",
      `|RECORD=Region|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT|VX0=${cutoutStartXMils}mil|VY0=0.15mil|VX1=0.35mil|VY1=0.13mil|VX2=0.35mil|VY2=0.17mil`,
    ].join("\n"),
  )
  const polygon = document.polygons[0]
  const cutout = document.records.find(
    (record): record is AltiumRegionRecord =>
      record instanceof AltiumRegionRecord,
  )
  if (!polygon || !cutout) throw new Error("Missing polygon or cutout")
  return {
    innerContour: getPcbRegionGeometry(cutout).outline,
    outerContour: getPcbContour(polygon),
  }
}

test("rejects fractional-mil cutouts touching a sloped polygon edge", () => {
  expect(isContourInsideContour(getContours(0.2))).toBe(false)
})

test("accepts fractional-mil cutouts separated from the edge", () => {
  expect(isContourInsideContour(getContours(0.2001))).toBe(true)
})
