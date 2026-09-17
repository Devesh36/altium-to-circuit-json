import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { PcbFabricationNotePath } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("imports Altium component-body contours as fabrication outlines", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|X=250mil|Y=250mil|LAYER=BOTTOM",
      "|RECORD=ComponentBody|COMPONENT=0|LAYER=MECHANICAL14|KIND0=0|VX0=100mil|VY0=100mil|KIND1=0|VX1=400mil|VY1=100mil|KIND2=0|VX2=400mil|VY2=400mil|KIND3=0|VX3=100mil|VY3=400mil",
    ].join("\n"),
  )

  const paths = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PcbFabricationNotePath =>
      element.type === "pcb_fabrication_note_path",
  )

  expect(paths).toHaveLength(1)
  expect(paths[0]?.layer).toBe("bottom")
  expect(paths[0]?.pcb_component_id).toBe("pcb_component_altium_0")
  expect(paths[0]?.route[0]).toEqual(paths[0]?.route.at(-1))
})
