import type { SourceTrace } from "circuit-json"
import { getCanonicalSourceId } from "./getCanonicalSourceId"

export const getSourceTraceConnectivityTokens = ({
  idReplacements,
  sourceTrace,
}: {
  idReplacements: Map<string, string>
  sourceTrace: SourceTrace
}): string[] => [
  ...sourceTrace.connected_source_port_ids.map(
    (id) =>
      `port:${getCanonicalSourceId({
        id,
        idReplacements,
      })}`,
  ),
  ...sourceTrace.connected_source_net_ids.map(
    (id) =>
      `net:${getCanonicalSourceId({
        id,
        idReplacements,
      })}`,
  ),
]
