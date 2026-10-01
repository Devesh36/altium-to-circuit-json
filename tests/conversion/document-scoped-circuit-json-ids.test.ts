import { expect, test } from "bun:test"
import { parseAltiumPcbDoc, parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import {
  convertAltiumPcbDocToCircuitJson,
  convertAltiumSchDocToCircuitJson,
} from "../../lib"

test("prefixes document IDs and every reference before outputs are combined", () => {
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

  const pcbCircuitJson = convertAltiumPcbDocToCircuitJson(pcbDocument, {
    idPrefix: "pcb_document",
  })
  const schematicCircuitJson = convertAltiumSchDocToCircuitJson(
    schematicDocument,
    {
      centerOnSchematicSheet: false,
      idPrefix: "schematic_document",
      schematicUnitScale: 0.1,
    },
  )
  const combinedCircuitJson = [...pcbCircuitJson, ...schematicCircuitJson]
  const primaryIds = combinedCircuitJson.map((element) =>
    Reflect.get(element, `${element.type}_id`),
  )
  const pcbSourceTrace = pcbCircuitJson.find(
    (element) => element.type === "source_trace",
  )
  const pcbTrace = pcbCircuitJson.find(
    (element) => element.type === "pcb_trace",
  )
  const schematicTrace = schematicCircuitJson.find(
    (element) => element.type === "schematic_trace",
  )
  const schematicGroup = schematicCircuitJson.find(
    (element) => element.type === "schematic_group",
  )

  expect(new Set(primaryIds).size).toBe(primaryIds.length)
  expect(
    pcbCircuitJson.every((element) =>
      Reflect.get(element, `${element.type}_id`).startsWith("pcb_document_"),
    ),
  ).toBe(true)
  expect(
    schematicCircuitJson.every((element) =>
      Reflect.get(element, `${element.type}_id`).startsWith(
        "schematic_document_",
      ),
    ),
  ).toBe(true)
  expect(pcbSourceTrace).toMatchObject({
    connected_source_net_ids: ["pcb_document_source_net_altium_pcb_0"],
    connected_source_port_ids: ["pcb_document_source_port_altium_3"],
    source_trace_id: "pcb_document_source_trace_altium_pcb_0",
  })
  expect(pcbTrace).toMatchObject({
    source_trace_id: "pcb_document_source_trace_altium_pcb_0",
  })
  expect(schematicTrace).toMatchObject({
    edges: [
      {
        to_schematic_port_id: "schematic_document_schematic_port_altium_2",
      },
      {
        from_schematic_port_id: "schematic_document_schematic_port_altium_2",
      },
    ],
    schematic_sheet_id: "schematic_document_schematic_sheet_altium",
    source_trace_id: "schematic_document_source_trace_altium_0",
  })
  expect(schematicGroup).toMatchObject({
    schematic_component_ids: [
      "schematic_document_schematic_component_altium_1",
    ],
  })
  expect(
    combinedCircuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
