import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("preserves Altium PCB net identities on routed copper", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|ID=0|LAYER=TOP|X=150mil|Y=150mil|SOURCEDESIGNATOR=U1|SOURCECOMMENT=DUAL-PAD-DEVICE|SOURCELIBREFERENCE=TEST",
      "|RECORD=Net|NAME=POWER_RAIL",
      "|RECORD=Net|NAME=SENSE",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=0|LAYER=TOP|X=100mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=0|LAYER=BOTTOM|X=100mil|Y=120mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Pad|NAME=2|COMPONENT=0|NET=1|LAYER=TOP|X=200mil|Y=200mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Track|LAYER=TOP|NET=0|X1=50mil|Y1=100mil|X2=250mil|Y2=100mil|WIDTH=10mil",
      "|RECORD=Arc|LAYER=BOTTOM|NET=1|LOCATION.X=250mil|LOCATION.Y=250mil|RADIUS=50mil|STARTANGLE=0|ENDANGLE=90|WIDTH=8mil",
      "|RECORD=Via|NET=1|X=250mil|Y=300mil|DIAMETER=40mil|HOLESIZE=20mil|STARTLAYER=TOP|ENDLAYER=BOTTOM",
      "|RECORD=Region|LAYER=TOP|NET=0|REGIONKIND=COPPER|KIND0=0|VX0=300mil|VY0=50mil|KIND1=0|VX1=450mil|VY1=50mil|KIND2=0|VX2=450mil|VY2=150mil|KIND3=0|VX3=300mil|VY3=150mil|KIND4=0|VX4=300mil|VY4=50mil",
    ].join("\n"),
  )

  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const nets = circuitJson.filter((element) => element.type === "source_net")
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const sourcePorts = circuitJson.filter(
    (element) => element.type === "source_port",
  )
  const pcbPorts = circuitJson.filter((element) => element.type === "pcb_port")
  const traces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const pcbTraces = circuitJson.filter(
    (element) => element.type === "pcb_trace",
  )
  const via = circuitJson.find((element) => element.type === "pcb_via")
  const pour = circuitJson.find((element) => element.type === "pcb_copper_pour")
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const powerTrace = pcbTraces.find(
    (trace) => trace.source_trace_id === "source_trace_altium_pcb_0",
  )
  const senseTrace = pcbTraces.find(
    (trace) => trace.source_trace_id === "source_trace_altium_pcb_1",
  )

  expect(nets).toMatchObject([
    { source_net_id: "source_net_altium_pcb_0", name: "POWER_RAIL" },
    { source_net_id: "source_net_altium_pcb_1", name: "SENSE" },
  ])
  expect(sourceComponents).toMatchObject([
    { source_component_id: "source_component_altium_0", name: "U1" },
  ])
  expect(sourcePorts).toMatchObject([
    {
      source_component_id: "source_component_altium_0",
      source_port_id: "source_port_altium_4",
      name: "1",
    },
    {
      source_component_id: "source_component_altium_0",
      source_port_id: "source_port_altium_6",
      name: "2",
    },
  ])
  expect(pcbPorts).toHaveLength(3)
  expect(
    pcbPorts
      .filter((port) => port.source_port_id === "source_port_altium_4")
      .map((port) => port.pcb_port_id),
  ).toEqual(["pcb_port_altium_4", "pcb_port_altium_5"])
  expect(traces).toMatchObject([
    {
      source_trace_id: "source_trace_altium_pcb_0",
      connected_source_port_ids: ["source_port_altium_4"],
      connected_source_net_ids: ["source_net_altium_pcb_0"],
    },
    {
      source_trace_id: "source_trace_altium_pcb_1",
      connected_source_port_ids: ["source_port_altium_6"],
      connected_source_net_ids: ["source_net_altium_pcb_1"],
    },
  ])
  expect(pcbTraces).toMatchObject([
    { source_trace_id: "source_trace_altium_pcb_0" },
    { source_trace_id: "source_trace_altium_pcb_1" },
  ])
  expect(
    circuitJson
      .filter((element) => element.type === "pcb_smtpad")
      .map((pad) => ({
        pcb_component_id: pad.pcb_component_id,
        pcb_port_id: pad.pcb_port_id,
      })),
  ).toEqual([
    {
      pcb_component_id: "pcb_component_altium_0",
      pcb_port_id: "pcb_port_altium_4",
    },
    {
      pcb_component_id: "pcb_component_altium_0",
      pcb_port_id: "pcb_port_altium_5",
    },
    {
      pcb_component_id: "pcb_component_altium_0",
      pcb_port_id: "pcb_port_altium_6",
    },
  ])
  expect(via).toMatchObject({
    source_net_id: "source_net_altium_pcb_1",
    source_trace_id: "source_trace_altium_pcb_1",
  })
  expect(pour).toMatchObject({ source_net_id: "source_net_altium_pcb_0" })
  expect(powerTrace).toBeDefined()
  expect(senseTrace).toBeDefined()
  if (!powerTrace || !senseTrace) throw new Error("Expected both routed nets")
  expect(
    connectivityMap.areIdsConnected(
      "source_net_altium_pcb_0",
      powerTrace.pcb_trace_id,
    ),
  ).toBe(true)
  expect(
    connectivityMap.areIdsConnected(
      "source_net_altium_pcb_1",
      senseTrace.pcb_trace_id,
    ),
  ).toBe(true)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})

test("rejects one component pin assigned to multiple Altium nets", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|VERSION=5.0|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|ID=0|LAYER=TOP|X=150mil|Y=150mil|SOURCEDESIGNATOR=U1",
      "|RECORD=Net|NAME=NET_A",
      "|RECORD=Net|NAME=NET_B",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=0|LAYER=TOP|X=100mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
      "|RECORD=Pad|NAME=1|COMPONENT=0|NET=1|LAYER=TOP|X=200mil|Y=100mil|XSIZE=40mil|YSIZE=40mil|SHAPE=RECTANGLE",
    ].join("\n"),
  )

  expect(() => convertAltiumPcbDocToCircuitJson(document)).toThrow(
    "Altium PCB component U1 pin 1 is assigned to multiple nets: NET_A, NET_B",
  )
})

test("inherits a poured region net from its parent polygon", () => {
  const outline =
    "|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=100mil|VY1=0mil|KIND2=0|VX2=100mil|VY2=100mil|KIND3=0|VX3=0mil|VY3=100mil|KIND4=0|VX4=0mil|VY4=0mil"
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Net|NAME=PARENT_NET",
      "|RECORD=Net|NAME=DIRECT_NET",
      `|RECORD=Polygon|ID=7|NET=0|LAYER=TOP${outline}`,
      `|RECORD=Region|POLYGON=7|LAYER=TOP|REGIONKIND=COPPER${outline}`,
      `|RECORD=Region|POLYGON=7|NET=1|LAYER=TOP|REGIONKIND=COPPER${outline}`,
    ].join("\n"),
  )

  const pours = convertAltiumPcbDocToCircuitJson(document).filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(
    pours.map(({ pcb_copper_pour_id, source_net_id }) => ({
      pcb_copper_pour_id,
      source_net_id,
    })),
  ).toEqual([
    {
      pcb_copper_pour_id: "pcb_copper_pour_altium_region_4",
      source_net_id: "source_net_altium_pcb_0",
    },
    {
      pcb_copper_pour_id: "pcb_copper_pour_altium_region_5",
      source_net_id: "source_net_altium_pcb_1",
    },
  ])
})
