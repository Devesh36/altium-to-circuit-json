import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbSilkscreenPath } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("imports Altium overlay regions as closed silkscreen paths", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Region|LAYER=TOPOVERLAY|KIND0=0|VX0=50mil|VY0=50mil|KIND1=0|VX1=450mil|VY1=50mil|KIND2=0|VX2=450mil|VY2=450mil|KIND3=0|VX3=50mil|VY3=450mil|HOLECOUNT=1|HOLE0COUNT=4|HOLE0VX0=150mil|HOLE0VY0=150mil|HOLE0VX1=350mil|HOLE0VY1=150mil|HOLE0VX2=350mil|HOLE0VY2=350mil|HOLE0VX3=150mil|HOLE0VY3=350mil",
    ].join("\n"),
  )

  const paths = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbSilkscreenPath =>
      element.type === "pcb_silkscreen_path",
  )

  expect(paths).toHaveLength(2)
  expect(paths.every((path) => path.layer === "top")).toBe(true)
  expect(
    paths.every(
      (path) =>
        path.route[0]?.x === path.route.at(-1)?.x &&
        path.route[0]?.y === path.route.at(-1)?.y,
    ),
  ).toBe(true)
})
