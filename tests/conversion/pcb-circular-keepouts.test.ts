import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { any_circuit_element, type PCBKeepout } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const circularKeepoutPcbDoc = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Arc|LAYER=KEEPOUT|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=75mil|STARTANGLE=0|ENDANGLE=0|WIDTH=20mil",
  ].join("\n"),
)

test("preserves an annular keepout without filling its center", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(circularKeepoutPcbDoc)
  const keepouts = circuitJson.filter(
    (element): element is PCBKeepout => element.type === "pcb_keepout",
  )

  expect(keepouts).toHaveLength(1)
  const keepout = keepouts[0]
  if (keepout?.shape !== "ring") {
    throw new Error("Expected ring keepout")
  }
  expect(keepout.layers).toEqual(["top", "bottom"])
  expect(keepout.inner_radius).toBeCloseTo(1.651)
  expect(keepout.outer_radius).toBeCloseTo(2.159)
  expect(any_circuit_element.safeParse(keepout).success).toBe(true)
  expect(
    convertAltiumPcbDocToCircuitJson(circularKeepoutPcbDoc, {
      includeKeepouts: false,
    }).some((element) => element.type === "pcb_keepout"),
  ).toBe(false)

  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg: serializeAltiumPcbToSvg(circularKeepoutPcbDoc),
    circuitJsonSvg: convertCircuitJsonToPcbSvg(circuitJson),
    label: "Circular PCB keepout",
  })
  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("uses each full-circle keepout's copper layer and skips keepouts when disabled", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|SHEETWIDTH=500mil|SHEETHEIGHT=500mil",
      "|RECORD=Arc|LAYER=TOP|KEEPOUT=TRUE|LOCATION.X=100mil|LOCATION.Y=250mil|RADIUS=80mil|STARTANGLE=0|ENDANGLE=360|WIDTH=30mil",
      "|RECORD=Arc|LAYER=BOTTOM|KEEPOUT=TRUE|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=20mil|STARTANGLE=0|ENDANGLE=360|WIDTH=50mil",
      "|RECORD=Arc|LAYER=TOP|LOCATION.X=400mil|LOCATION.Y=250mil|RADIUS=40mil|STARTANGLE=0|ENDANGLE=360|WIDTH=20mil",
    ].join("\n"),
  )

  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const keepouts = circuitJson.filter(
    (element): element is PCBKeepout => element.type === "pcb_keepout",
  )
  expect(
    keepouts.filter((keepout) => keepout.layers[0] === "top"),
  ).toHaveLength(1)
  expect(keepouts.find((keepout) => keepout.layers[0] === "top")?.shape).toBe(
    "ring",
  )
  expect(
    keepouts.filter((keepout) => keepout.layers[0] === "bottom"),
  ).toHaveLength(1)
  expect(
    circuitJson.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(1)

  const withoutKeepouts = convertAltiumPcbDocToCircuitJson(document, {
    includeKeepouts: false,
  })
  expect(
    withoutKeepouts.filter((element) => element.type === "pcb_keepout"),
  ).toHaveLength(0)
  expect(
    withoutKeepouts.filter((element) => element.type === "pcb_trace"),
  ).toHaveLength(1)
})

test("represents a thin TI-style circular keepout with one ring", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|SHEETWIDTH=500mil|SHEETHEIGHT=500mil",
      "|RECORD=Arc|LAYER=KEEPOUT|LOCATION.X=100mil|LOCATION.Y=100mil|RADIUS=103mil|STARTANGLE=0|ENDANGLE=0|WIDTH=1mil",
    ].join("\n"),
  )
  const keepouts = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is PCBKeepout => element.type === "pcb_keepout",
  )

  expect(keepouts).toHaveLength(1)
  const keepout = keepouts[0]
  if (keepout?.shape !== "ring") {
    throw new Error("Expected ring keepout")
  }
  expect(keepout.inner_radius).toBeCloseTo(2.6035)
  expect(keepout.outer_radius).toBeCloseTo(2.6289)
})
