import type { AltiumPadRecord } from "altiumts"
import type { PcbPlatedHole, PcbPort, PcbSmtPad } from "circuit-json"
import { milsToMillimeters } from "../geometry"
import type { PcbComponentContext } from "../model"

type ElectricalPcbPad = PcbSmtPad | PcbPlatedHole

export function connectPcbPad({
  componentContext,
  includeComponentOwnership,
  pad,
  record,
  recordIndex,
}: {
  componentContext: PcbComponentContext
  includeComponentOwnership: boolean
  pad: ElectricalPcbPad
  record: AltiumPadRecord
  recordIndex: number
}): Array<ElectricalPcbPad | PcbPort> {
  const sourcePortId = componentContext.getSourcePortId(record)
  if (!sourcePortId) {
    throw new Error(
      `Converted electrical pad ${recordIndex} has no source port`,
    )
  }
  if (!record.position) {
    throw new Error(`Converted electrical pad ${recordIndex} has no position`)
  }
  const pcbPortId = `pcb_port_altium_${recordIndex}`
  const pcbComponentId = includeComponentOwnership
    ? componentContext.getPcbComponentId(record)
    : undefined
  const pinName = record.name?.trim()
  const connectedPad: ElectricalPcbPad = {
    ...pad,
    pcb_port_id: pcbPortId,
    ...(pinName ? { port_hints: [pinName] } : {}),
    ...(pcbComponentId ? { pcb_component_id: pcbComponentId } : {}),
  }
  const pcbPort: PcbPort = {
    type: "pcb_port",
    pcb_port_id: pcbPortId,
    source_port_id: sourcePortId,
    x: milsToMillimeters(record.position.x),
    y: milsToMillimeters(record.position.y),
    layers: pad.type === "pcb_smtpad" ? [pad.layer] : [...pad.layers],
    ...(pcbComponentId ? { pcb_component_id: pcbComponentId } : {}),
  }
  return [pcbPort, connectedPad]
}
