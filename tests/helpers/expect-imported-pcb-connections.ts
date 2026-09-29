import { expect } from "bun:test"
import { AltiumPadRecord, type AltiumPcbDocument } from "altiumts"
import type {
  AnyCircuitElement,
  PcbCopperPour,
  PcbPlatedHole,
  PcbSmtPad,
} from "circuit-json"

export function expectImportedPcbConnections({
  circuitJson,
  document,
  expectedConnectionCount,
  expectedInheritedCopperAreaCount,
}: {
  circuitJson: AnyCircuitElement[]
  document: AltiumPcbDocument
  expectedConnectionCount: number
  expectedInheritedCopperAreaCount: number
}): void {
  const sourceNets = circuitJson.filter(
    (element) => element.type === "source_net",
  )
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const sourcePorts = circuitJson.filter(
    (element) => element.type === "source_port",
  )
  const pcbPorts = circuitJson.filter((element) => element.type === "pcb_port")
  const sourcePortIds = new Set(sourcePorts.map((port) => port.source_port_id))
  const pcbPortIds = new Set(pcbPorts.map((port) => port.pcb_port_id))
  const connectedPads = circuitJson.filter(
    (element): element is PcbSmtPad | PcbPlatedHole =>
      (element.type === "pcb_smtpad" || element.type === "pcb_plated_hole") &&
      element.pcb_port_id !== undefined,
  )
  const connectedPadById = new Map(
    connectedPads.map((pad) => [
      pad.type === "pcb_smtpad" ? pad.pcb_smtpad_id : pad.pcb_plated_hole_id,
      pad,
    ]),
  )
  const pcbPortById = new Map(pcbPorts.map((port) => [port.pcb_port_id, port]))
  const sourceTraceById = new Map(
    sourceTraces.map((trace) => [trace.source_trace_id, trace]),
  )
  const recordIndexByRecord = new Map(
    document.records.map((record, index) => [record, index]),
  )
  const copperPours = circuitJson.filter(
    (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
  )
  let inheritedCopperAreaCount = 0

  expect(document.nets).toHaveLength(expectedConnectionCount)
  expect(sourceNets).toHaveLength(expectedConnectionCount)
  expect(sourceTraces).toHaveLength(expectedConnectionCount)
  expect(
    sourceTraces.every((trace) => trace.connected_source_port_ids.length > 0),
  ).toBe(true)
  expect(
    sourceTraces.every((trace) =>
      trace.connected_source_port_ids.every((sourcePortId) =>
        sourcePortIds.has(sourcePortId),
      ),
    ),
  ).toBe(true)
  expect(pcbPorts.length).toBeGreaterThan(0)
  expect(pcbPorts.every((port) => sourcePortIds.has(port.source_port_id))).toBe(
    true,
  )
  expect(connectedPads).toHaveLength(pcbPorts.length)
  expect(
    connectedPads.every(
      (pad) => pad.pcb_port_id !== undefined && pcbPortIds.has(pad.pcb_port_id),
    ),
  ).toBe(true)

  for (const [netIndex, net] of document.nets.entries()) {
    const sourceTraceId = `source_trace_altium_pcb_${netIndex}`
    const sourceTrace = sourceTraceById.get(sourceTraceId)
    if (!sourceTrace) throw new Error(`Missing ${sourceTraceId}`)
    const expectedSourcePortIds = new Set<string>()
    for (const record of document.getRecordsOnNet(net)) {
      if (!(record instanceof AltiumPadRecord)) continue
      const recordIndex = recordIndexByRecord.get(record)
      if (recordIndex === undefined) throw new Error("Missing Altium pad index")
      const convertedPad =
        connectedPadById.get(`pcb_smtpad_altium_${recordIndex}`) ??
        connectedPadById.get(`pcb_plated_hole_altium_${recordIndex}`)
      if (!convertedPad) {
        throw new Error(
          `Missing converted pad for Altium record ${recordIndex}`,
        )
      }
      if (!convertedPad.pcb_port_id) {
        throw new Error(`Converted pad ${recordIndex} has no PCB port`)
      }
      const pcbPort = pcbPortById.get(convertedPad.pcb_port_id)
      if (!pcbPort) throw new Error(`Missing ${convertedPad.pcb_port_id}`)
      expectedSourcePortIds.add(pcbPort.source_port_id)
    }
    expect(sourceTrace.connected_source_port_ids).toEqual([
      ...expectedSourcePortIds,
    ])
  }

  for (const pour of copperPours) {
    const recordMatch = /^pcb_copper_pour_altium_(?:region|fill)_(\d+)$/u.exec(
      pour.pcb_copper_pour_id,
    )
    const polygonMatch = /^pcb_copper_pour_altium_polygon_(\d+)$/u.exec(
      pour.pcb_copper_pour_id,
    )
    const record = recordMatch
      ? document.records[Number(recordMatch[1])]
      : polygonMatch
        ? document.polygons[Number(polygonMatch[1])]
        : undefined
    if (!record) {
      throw new Error(`Missing Altium record for ${pour.pcb_copper_pour_id}`)
    }

    const directNet = document.getNetForRecord(record)
    const parentPolygon = document.getPolygonForRecord(record)
    const inheritedNet = parentPolygon
      ? document.getNetForRecord(parentPolygon)
      : undefined
    if (!directNet && inheritedNet) inheritedCopperAreaCount += 1
    const expectedNet = directNet ?? inheritedNet
    const expectedNetIndex = expectedNet
      ? document.nets.indexOf(expectedNet)
      : -1
    const expectedSourceNetId =
      expectedNetIndex < 0
        ? undefined
        : `source_net_altium_pcb_${expectedNetIndex}`
    expect(pour.source_net_id).toBe(expectedSourceNetId)
  }
  expect(inheritedCopperAreaCount).toBe(expectedInheritedCopperAreaCount)
}
