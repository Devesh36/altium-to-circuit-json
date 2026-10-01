import type { AnyCircuitElement, SourcePort } from "circuit-json"
import { getSourcePortIdentity } from "./getSourcePortIdentity"

export const reconcileSourcePortIds = ({
  elements,
  idReplacements,
}: {
  elements: AnyCircuitElement[]
  idReplacements: Map<string, string>
}): void => {
  const sourcePortsByIdentity = new Map<string, SourcePort>()

  for (const element of elements) {
    if (element.type !== "source_port") continue
    const portIdentity = getSourcePortIdentity({
      idReplacements,
      sourcePort: element,
    })
    if (!portIdentity) continue
    const canonical = sourcePortsByIdentity.get(portIdentity)
    if (canonical) {
      idReplacements.set(element.source_port_id, canonical.source_port_id)
    } else {
      sourcePortsByIdentity.set(portIdentity, element)
    }
  }
}
