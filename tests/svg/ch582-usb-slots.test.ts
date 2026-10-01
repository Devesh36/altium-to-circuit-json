import { expect, test } from "bun:test"
import {
  AltiumPadRecord,
  getAltiumBounds,
  getAltiumPcbPadGeometry,
  normalizeAltiumAngle,
  parseAltiumPcbDoc,
  serializeAltiumPcbLayerToSvg,
} from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { readReferenceText } from "../helpers/read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("CH582 USB slots preserve independent copper and drill rotations", async () => {
  const document = parseAltiumPcbDoc(await readReferenceText("ch582.PcbDoc"))
  const slots = document.records.filter(
    (record): record is AltiumPadRecord =>
      record instanceof AltiumPadRecord &&
      getAltiumPcbPadGeometry({ record }).holeShape === "SLOT",
  )
  expect(slots.length).toBeGreaterThan(0)
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  for (const record of slots) {
    const geometry = getAltiumPcbPadGeometry({ record })
    expect(normalizeAltiumAngle(geometry.holeCcwRotationDegrees)).not.toBe(0)
    expect(
      circuitJson.find(
        (element) =>
          element.type === "pcb_plated_hole" &&
          element.pcb_plated_hole_id ===
            `pcb_plated_hole_altium_${document.records.indexOf(record)}`,
      ),
    ).toEqual(
      expect.objectContaining({
        shape: "rotated_pill_hole_with_rect_pad",
        hole_width: milsToMillimeters(geometry.slotLengthMils),
        hole_height: milsToMillimeters(geometry.holeSizeMils),
        hole_ccw_rotation: normalizeAltiumAngle(
          geometry.ccwRotationDegrees + geometry.holeCcwRotationDegrees,
        ),
        rect_pad_width: milsToMillimeters(geometry.widthMils),
        rect_pad_height: milsToMillimeters(geometry.heightMils),
        rect_border_radius:
          milsToMillimeters(Math.min(geometry.widthMils, geometry.heightMils)) /
          2,
        rect_ccw_rotation: geometry.ccwRotationDegrees,
      }),
    )
  }
  const bounds = getAltiumBounds(
    document.records.flatMap((record) =>
      record instanceof AltiumPadRecord &&
      record.componentIndex === slots[0]?.componentIndex &&
      record.position
        ? [record.position]
        : [],
    ),
  )
  if (!bounds) throw new Error("USB footprint has no bounds")
  const paddingMils = Math.max(
    ...slots.map((record) => getAltiumPcbPadGeometry({ record }).heightMils),
  )
  const viewBox = {
    x: bounds.minX - paddingMils,
    y: bounds.minY - paddingMils,
    width: bounds.maxX - bounds.minX + 2 * paddingMils,
    height: bounds.maxY - bounds.minY + 2 * paddingMils,
  }
  const altiumSvg = serializeAltiumPcbLayerToSvg(document, "TOP", {
    width: 800,
    height: 800,
    viewBox,
    showText: false,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: 800,
    height: 800,
    viewport: {
      minX: milsToMillimeters(viewBox.x),
      minY: milsToMillimeters(viewBox.y),
      maxX: milsToMillimeters(viewBox.x + viewBox.width),
      maxY: milsToMillimeters(viewBox.y + viewBox.height),
    },
  })
  await expect(
    stackAltiumAndCircuitJsonSvgs({
      altiumSvg,
      circuitJsonSvg,
      label: "CH582 USB mounting slots",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
