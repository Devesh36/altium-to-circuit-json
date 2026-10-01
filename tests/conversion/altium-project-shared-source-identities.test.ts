import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, parseAltiumSchDoc } from "altiumts"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { convertAltiumProjectToCircuitJson } from "../../lib"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>

test("shares source identities across Altium project documents", async () => {
  const pcbDocument = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|ID=0|LAYER=TOP|X=150mil|Y=150mil|SOURCEDESIGNATOR=U1",
      "|RECORD=Net|NAME=SIGNAL",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=0|LAYER=TOP|X=100mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Track|LAYER=TOP|NET=0|X1=100mil|Y1=100mil|X2=250mil|Y2=100mil|WIDTH=10mil",
    ].join("\n"),
  )
  const schematicDocument = parseAltiumSchDoc(
    [
      "|RECORD=31|CUSTOMX=100|CUSTOMY=100|SIZE1=10|FONTNAME1=Arial",
      "|RECORD=1|LOCATION.X=20|LOCATION.Y=20|DESIGNATOR=U1|LIBREFERENCE=TEST|PARTCOUNT=1|DISPLAYMODE=0",
      "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|DESIGNATOR=1|NAME=IN|LOCATION.X=20|LOCATION.Y=20|PINLENGTH=10|ORIENTATION=0",
      "|RECORD=27|LOCATIONCOUNT=2|X1=20|Y1=20|X2=50|Y2=20",
    ].join("\n"),
  )
  const circuitJson = convertAltiumProjectToCircuitJson({
    pcb: { document: pcbDocument },
    schematics: [
      {
        document: schematicDocument,
        options: {
          centerOnSchematicSheet: false,
          schematicUnitScale: 0.1,
        },
      },
      {
        document: schematicDocument,
        options: {
          centerOnSchematicSheet: false,
          schematicUnitScale: 0.1,
        },
      },
    ],
  })
  const sourceComponents = circuitJson.filter(
    (element): element is SourceComponent =>
      element.type === "source_component" && element.name === "U1",
  )
  const sourcePorts = circuitJson.filter(
    (element) =>
      element.type === "source_port" &&
      element.source_component_id ===
        sourceComponents[0]?.source_component_id &&
      String(element.pin_number) === "1",
  )
  const pcbComponent = circuitJson.find(
    (element) => element.type === "pcb_component",
  )
  const schematicComponents = circuitJson.filter(
    (element) => element.type === "schematic_component",
  )
  const pcbPort = circuitJson.find((element) => element.type === "pcb_port")
  const schematicPort = circuitJson.find(
    (element) => element.type === "schematic_port",
  )
  const pcbTrace = circuitJson.find((element) => element.type === "pcb_trace")
  const schematicTrace = circuitJson.find(
    (element) => element.type === "schematic_trace",
  )
  const primaryIds = circuitJson.map((element) =>
    Reflect.get(element, `${element.type}_id`),
  )

  expect(sourceComponents).toHaveLength(1)
  expect(sourcePorts).toHaveLength(1)
  expect(schematicComponents).toHaveLength(2)
  expect(
    schematicComponents.every(
      (component) =>
        component.source_component_id === pcbComponent?.source_component_id,
    ),
  ).toBe(true)
  expect(pcbPort?.source_port_id).toBe(schematicPort?.source_port_id)
  expect(pcbTrace?.source_trace_id).toBe(schematicTrace?.source_trace_id)
  expect(new Set(primaryIds).size).toBe(primaryIds.length)
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
