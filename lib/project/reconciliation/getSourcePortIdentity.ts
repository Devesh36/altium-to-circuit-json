import type { SourcePort } from "circuit-json"
import { getCanonicalSourceId } from "./getCanonicalSourceId"
import { normalizeSourceIdentityName } from "./normalizeSourceIdentityName"

export const getSourcePortIdentity = ({
  idReplacements,
  sourcePort,
}: {
  idReplacements: Map<string, string>
  sourcePort: SourcePort
}): string | null => {
  if (!sourcePort.source_component_id) return null
  const sourceComponentId = getCanonicalSourceId({
    id: sourcePort.source_component_id,
    idReplacements,
  })
  const pinIdentity =
    sourcePort.pin_number !== undefined
      ? `pin:${sourcePort.pin_number}`
      : sourcePort.port_hints?.[0]
        ? `hint:${sourcePort.port_hints[0]}`
        : sourcePort.name
          ? `name:${normalizeSourceIdentityName(sourcePort.name)}`
          : null

  return pinIdentity ? `${sourceComponentId}:${pinIdentity}` : null
}
