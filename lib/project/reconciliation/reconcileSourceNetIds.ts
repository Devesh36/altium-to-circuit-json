import type { AnyCircuitElement, SourceNet } from "circuit-json"
import { normalizeSourceIdentityName } from "./normalizeSourceIdentityName"

export const reconcileSourceNetIds = ({
  elements,
  idReplacements,
}: {
  elements: AnyCircuitElement[]
  idReplacements: Map<string, string>
}): void => {
  const sourceNetsByName = new Map<string, SourceNet>()

  for (const element of elements) {
    if (element.type !== "source_net" || !element.name?.trim()) continue
    const netName = normalizeSourceIdentityName(element.name)
    const canonical = sourceNetsByName.get(netName)
    if (canonical) {
      idReplacements.set(element.source_net_id, canonical.source_net_id)
    } else {
      sourceNetsByName.set(netName, element)
    }
  }
}
