import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, parseAltiumSchDoc } from "altiumts"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { convertAltiumProjectToCircuitJson } from "../../lib"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>
type SourcePort = Extract<AnyCircuitElement, { type: "source_port" }>

test("merges overlapping trace connectivity across Altium project sheets", async () => {
  const pcbDocument = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|ID=0|LAYER=TOP|X=100mil|Y=100mil|SOURCEDESIGNATOR=U1",
      "|RECORD=Component|ID=1|LAYER=TOP|X=250mil|Y=100mil|SOURCEDESIGNATOR=R1",
      "|RECORD=Component|ID=2|LAYER=TOP|X=400mil|Y=100mil|SOURCEDESIGNATOR=R2",
      "|RECORD=Net|NAME=SIGNAL",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=0|LAYER=TOP|X=100mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Pad|NAME=1|COMPONENT=1|NET=0|LAYER=TOP|X=250mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Pad|NAME=1|COMPONENT=2|NET=0|LAYER=TOP|X=400mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Track|LAYER=TOP|NET=0|X1=100mil|Y1=100mil|X2=250mil|Y2=100mil|WIDTH=10mil",
      "|RECORD=Track|LAYER=TOP|NET=0|X1=250mil|Y1=100mil|X2=400mil|Y2=100mil|WIDTH=10mil",
    ].join("\n"),
  )
  const firstSchematicDocument = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      "|RECORD=1|LOCATION.X=20|LOCATION.Y=20|DESIGNATOR=U1|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
      "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=20|LOCATION.Y=20|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=1|LOCATION.X=50|LOCATION.Y=20|DESIGNATOR=R1|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
      "|RECORD=2|OWNERINDEX=3|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=50|LOCATION.Y=20|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=27|LOCATIONCOUNT=2|X1=20|Y1=20|X2=50|Y2=20",
    ].join("\n"),
  )
  const secondSchematicDocument = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      "|RECORD=1|LOCATION.X=20|LOCATION.Y=40|DESIGNATOR=U1|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
      "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=20|LOCATION.Y=40|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=1|LOCATION.X=50|LOCATION.Y=40|DESIGNATOR=R2|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
      "|RECORD=2|OWNERINDEX=3|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=50|LOCATION.Y=40|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=27|LOCATIONCOUNT=2|X1=20|Y1=40|X2=50|Y2=40",
    ].join("\n"),
  )
  const circuitJson = convertAltiumProjectToCircuitJson({
    pcb: { document: pcbDocument },
    schematics: [firstSchematicDocument, secondSchematicDocument].map(
      (document) => ({
        document,
        options: {
          centerOnSchematicSheet: false,
          schematicUnitScale: 0.1,
        },
      }),
    ),
  })
  const sourceComponents = circuitJson.filter(
    (element): element is SourceComponent =>
      element.type === "source_component",
  )
  const sourceComponentIdsByName = new Map(
    sourceComponents.map((component) => [
      component.name,
      component.source_component_id,
    ]),
  )
  const expectedSourcePortIds = circuitJson
    .filter(
      (element): element is SourcePort =>
        element.type === "source_port" &&
        ["U1", "R1", "R2"].some(
          (name) =>
            sourceComponentIdsByName.get(name) === element.source_component_id,
        ),
    )
    .map((port) => port.source_port_id)
    .sort()
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const renderedTraces = circuitJson.filter(
    (element) =>
      element.type === "pcb_trace" || element.type === "schematic_trace",
  )

  expect(sourceComponents).toHaveLength(3)
  expect(expectedSourcePortIds).toHaveLength(3)
  expect(sourceTraces).toHaveLength(1)
  expect([...sourceTraces[0]!.connected_source_port_ids].sort()).toEqual(
    expectedSourcePortIds,
  )
  expect(
    renderedTraces.every(
      (trace) => trace.source_trace_id === sourceTraces[0]!.source_trace_id,
    ),
  ).toBe(true)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
  await expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "pcb",
  )
  await expect(
    convertCircuitJsonToSchematicSvg(circuitJson),
  ).toMatchSvgSnapshot(import.meta.path, "schematic")
})
