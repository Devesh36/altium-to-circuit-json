import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbSilkscreenGraphic } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("imports Altium overlay regions as filled silkscreen graphics", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Region|LAYER=TOPOVERLAY|KIND0=0|VX0=50mil|VY0=50mil|KIND1=0|VX1=450mil|VY1=50mil|KIND2=0|VX2=450mil|VY2=450mil|KIND3=0|VX3=50mil|VY3=450mil|HOLECOUNT=1|HOLE0COUNT=4|HOLE0VX0=150mil|HOLE0VY0=150mil|HOLE0VX1=350mil|HOLE0VY1=150mil|HOLE0VX2=350mil|HOLE0VY2=350mil|HOLE0VX3=150mil|HOLE0VY3=350mil",
    ].join("\n"),
  )

  const graphics = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbSilkscreenGraphic =>
      element.type === "pcb_silkscreen_graphic",
  )

  expect(graphics).toHaveLength(1)
  expect(graphics[0]?.layer).toBe("top")
  expect(graphics[0]?.shape).toBe("brep")
  expect(graphics[0]?.brep_shape.outer_ring.vertices).toHaveLength(4)
  expect(graphics[0]?.brep_shape.inner_rings).toHaveLength(1)
  expect(graphics[0]?.brep_shape.inner_rings[0]?.vertices).toHaveLength(4)
})
