import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { stackAltiumAndCircuitJsonSvgs } from "../helpers/stack-svg-comparison"

const document = parseAltiumPcbDoc(
  [
    "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=700mil|VY1=0mil|KIND2=0|VX2=700mil|VY2=400mil|KIND3=0|VX3=0mil|VY3=400mil|KIND4=0|VX4=0mil|VY4=0mil",
    "|RECORD=Component|ID=0|LAYER=TOP|X=200mil|Y=200mil|NAMEON=FALSE|COMMENTON=FALSE",
    "|RECORD=Text|COMPONENT=0|LAYER=TOPOVERLAY|X=150mil|Y=240mil|HEIGHT=45mil|TEXT=R1|DESIGNATOR=TRUE",
    "|RECORD=Text|COMPONENT=0|LAYER=TOPOVERLAY|X=150mil|Y=160mil|HEIGHT=45mil|TEXT=CRCW060310K0FKEA|COMMENT=TRUE",
    "|RECORD=Component|ID=1|LAYER=TOP|X=500mil|Y=200mil|NAMEON=TRUE|COMMENTON=TRUE",
    "|RECORD=Text|COMPONENT=1|LAYER=TOPOVERLAY|X=450mil|Y=240mil|HEIGHT=45mil|TEXT=R2|DESIGNATOR=TRUE",
    "|RECORD=Text|COMPONENT=1|LAYER=TOPOVERLAY|X=450mil|Y=160mil|HEIGHT=45mil|TEXT=10k|COMMENT=TRUE",
    "|RECORD=Text|COMPONENT=65535|LAYER=TOPOVERLAY|X=350mil|Y=330mil|HEIGHT=35mil|TEXT=BOARD LABEL",
  ].join("\n"),
)

test("respects component designator and comment visibility", async () => {
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const text = circuitJson.filter(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text",
  )

  expect(text.map((element) => element.text)).toEqual([
    "R2",
    "10k",
    "BOARD LABEL",
  ])

  const withHiddenText = convertAltiumPcbDocToCircuitJson(document, {
    includeHiddenText: true,
  }).filter(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text",
  )
  expect(withHiddenText).toHaveLength(5)

  const altiumSvg = serializeAltiumPcbToSvg(document, {
    height: 500,
    title: "Altium component text visibility",
    width: 800,
  })
  const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    height: 500,
    matchBoardAspectRatio: true,
    width: 800,
  })
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: "PCB component text visibility",
  })

  await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
