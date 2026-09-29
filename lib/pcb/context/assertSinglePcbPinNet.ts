import type {
  AltiumComponentRecord,
  AltiumPadRecord,
  AltiumPcbDocument,
} from "altiumts"

export function assertSinglePcbPinNet({
  component,
  document,
  pinName,
  records,
}: {
  component: AltiumComponentRecord
  document: AltiumPcbDocument
  pinName: string
  records: AltiumPadRecord[]
}): void {
  const assignedNets = records.flatMap((record) => {
    const net = document.getNetForRecord(record)
    return net ? [net] : []
  })
  const distinctNets = [...new Set(assignedNets)]
  if (distinctNets.length <= 1) return

  const designator = component.designator?.trim() || "unnamed component"
  const netNames = distinctNets.map(
    (net, index) => net.name?.trim() || `unnamed net ${index + 1}`,
  )
  throw new Error(
    `Altium PCB component ${designator} pin ${pinName} is assigned to multiple nets: ${netNames.join(", ")}`,
  )
}
