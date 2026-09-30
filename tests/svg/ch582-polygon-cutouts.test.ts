import { expect, test } from "bun:test"
import {
  AltiumRegionRecord,
  AltiumTrackRecord,
  getAltiumBounds,
  getPcbContour,
  getPcbRecordPolygonIndex,
  parseAltiumPcbDoc,
  serializeAltiumPcbLayerToSvg,
  serializeAltiumPcbToSvg,
} from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { getPreferredPcbBoardOutline } from "../../lib/pcb/board/getPreferredPcbBoardOutline"
import { milsToMillimeters } from "../../lib/pcb/geometry"
import { hasCopperAt } from "../helpers/hasCopperAt"
import { readReferenceText } from "../helpers/read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

test("CH582 PCB polygon cutouts", async () => {
  const document = parseAltiumPcbDoc(await readReferenceText("ch582.PcbDoc"))
  const bottomCutouts = document.records.filter(
    (region) =>
      region instanceof AltiumRegionRecord &&
      region.regionKind === "POLYGON_CUTOUT" &&
      region.layer === "BOTTOM",
  )
  expect(bottomCutouts).toHaveLength(2)
  expect(
    bottomCutouts.every(
      (cutout) => getPcbRecordPolygonIndex(document, cutout) === undefined,
    ),
  ).toBe(true)

  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const bottomTracks = document.records.filter(
    (record) =>
      record instanceof AltiumTrackRecord && record.layer === "BOTTOM",
  )
  expect(bottomTracks.length).toBeGreaterThan(0)
  const bottomTraces = circuitJson.filter(
    (element) =>
      element.type === "pcb_trace" &&
      element.route.some(
        (point) => point.route_type === "wire" && point.layer === "bottom",
      ),
  )
  expect(bottomTraces).toHaveLength(bottomTracks.length)
  const bottomPolygon = circuitJson
    .filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
    )
    .find((pour) => pour.layer === "bottom" && pour.shape === "brep")
  expect(bottomPolygon?.shape).toBe("brep")
  if (bottomPolygon?.shape !== "brep") {
    throw new Error("CH582 bottom polygon did not contain its cutouts")
  }
  expect(bottomPolygon.brep_shape.inner_rings).toHaveLength(1)
  const topPolygon = circuitJson
    .filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
    )
    .find((pour) => pour.layer === "top")
  expect(topPolygon?.shape).toBe("brep")
  if (topPolygon?.shape !== "brep") {
    throw new Error("CH582 top polygon did not contain its cutouts")
  }
  const topCutouts = document.records.filter(
    (region) =>
      region instanceof AltiumRegionRecord &&
      region.regionKind === "POLYGON_CUTOUT" &&
      region.layer === "TOP",
  )
  expect(topCutouts).toHaveLength(2)
  expect(topPolygon.brep_shape.inner_rings).toHaveLength(1)
  for (const layer of ["top", "bottom"] as const) {
    const pours = circuitJson.filter(
      (element): element is PcbCopperPour =>
        element.type === "pcb_copper_pour" && element.layer === layer,
    )
    // Both saved cutouts cover this point on each copper layer.
    expect(
      hasCopperAt(pours, {
        x: milsToMillimeters(2430),
        y: milsToMillimeters(3450),
      }),
    ).toBe(false)
  }

  const boardBounds = getAltiumBounds([
    ...getPreferredPcbBoardOutline(document),
    ...document.polygons.flatMap((polygon) => getPcbContour(polygon).points),
  ])
  if (!boardBounds) throw new Error("CH582 board outline has no bounds")
  const boardMaxSpanMils = Math.max(
    boardBounds.maxX - boardBounds.minX,
    boardBounds.maxY - boardBounds.minY,
  )
  const paddingMils = boardMaxSpanMils * 0.05
  const viewBoxSideMils = boardMaxSpanMils + 2 * paddingMils
  const viewBox = {
    x: (boardBounds.minX + boardBounds.maxX - viewBoxSideMils) / 2,
    y: (boardBounds.minY + boardBounds.maxY - viewBoxSideMils) / 2,
    width: viewBoxSideMils,
    height: viewBoxSideMils,
  }
  for (const view of [
    { name: "bottom", altiumLayer: "BOTTOM", circuitJsonLayer: "bottom" },
    { name: "board", altiumLayer: undefined, circuitJsonLayer: undefined },
  ] as const) {
    const altiumOptions = {
      height: 800,
      showBoardOutline: false,
      viewBox,
      width: 800,
    }
    const altiumSvg = view.altiumLayer
      ? serializeAltiumPcbLayerToSvg(document, view.altiumLayer, {
          ...altiumOptions,
          showText: false,
        })
      : serializeAltiumPcbToSvg(document, altiumOptions)
    const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
      height: 800,
      ...(view.circuitJsonLayer ? { layer: view.circuitJsonLayer } : {}),
      viewport: {
        minX: milsToMillimeters(viewBox.x),
        minY: milsToMillimeters(viewBox.y),
        maxX: milsToMillimeters(viewBox.x + viewBox.width),
        maxY: milsToMillimeters(viewBox.y + viewBox.height),
      },
      width: 800,
    })
    const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
      altiumSvg,
      circuitJsonSvg,
      label:
        view.name === "board"
          ? "CH582 full PCB"
          : "CH582 bottom copper polygon cutouts",
    })

    await expect(comparisonSvg).toMatchSvgSnapshot(
      import.meta.path,
      view.name === "board" ? "board" : undefined,
    )
  }
})
