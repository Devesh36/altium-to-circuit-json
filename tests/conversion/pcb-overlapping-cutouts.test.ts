import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { hasCopperAt } from "../helpers/hasCopperAt"

test("subtracts another cutout from a copper island", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      rectangleRecord({
        prefix: "|RECORD=Polygon|ID=0|LAYER=TOP",
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
      }),
      rectangleRecord({
        prefix: "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT",
        minX: 20,
        maxX: 60,
      }) +
        "|HOLECOUNT=1|HOLE0COUNT=4|HOLE0VX0=30mil|HOLE0VY0=30mil|HOLE0VX1=50mil|HOLE0VY1=30mil|HOLE0VX2=50mil|HOLE0VY2=50mil|HOLE0VX3=30mil|HOLE0VY3=50mil",
      rectangleRecord({
        prefix: "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT",
        minX: 40,
        maxX: 80,
      }),
    ].join("\n"),
  )
  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
  )
  expect(
    hasCopperAt(pours, { x: milsToMillimeters(35), y: milsToMillimeters(40) }),
  ).toBe(true)
  expect(
    hasCopperAt(pours, { x: milsToMillimeters(45), y: milsToMillimeters(40) }),
  ).toBe(false)
})

function rectangleRecord({
  prefix,
  minX,
  maxX,
  minY = 20,
  maxY = 60,
}: {
  prefix: string
  minX: number
  maxX: number
  minY?: number
  maxY?: number
}) {
  return `${prefix}|VX0=${minX}mil|VY0=${minY}mil|VX1=${maxX}mil|VY1=${minY}mil|VX2=${maxX}mil|VY2=${maxY}mil|VX3=${minX}mil|VY3=${maxY}mil`
}

test.each([40, 20])(
  "subtracts overlapping or duplicate cutouts at x=%s",
  (secondMinX) => {
    const document = parseAltiumPcbDoc(
      [
        "|RECORD=Board",
        rectangleRecord({
          prefix: "|RECORD=Polygon|ID=0|LAYER=TOP",
          minX: 0,
          maxX: 100,
          minY: 0,
          maxY: 100,
        }),
        ...[20, secondMinX].map((minX) =>
          rectangleRecord({
            prefix:
              "|RECORD=Region|POLYGON=0|LAYER=TOP|REGIONKIND=POLYGON_CUTOUT",
            minX,
            maxX: minX + 40,
          }),
        ),
      ].join("\n"),
    )
    const pours = convertAltiumPcbDocToCircuitJson(document).filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
    )
    for (const xMils of [30, 50, secondMinX + 30]) {
      expect(
        hasCopperAt(pours, {
          x: milsToMillimeters(xMils),
          y: milsToMillimeters(40),
        }),
      ).toBe(false)
    }
    expect(
      hasCopperAt(pours, {
        x: milsToMillimeters(10),
        y: milsToMillimeters(40),
      }),
    ).toBe(true)
  },
)
