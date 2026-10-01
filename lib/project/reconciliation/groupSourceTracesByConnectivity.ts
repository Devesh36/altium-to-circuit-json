import type { AnyCircuitElement } from "circuit-json"
import type { SourceTraceConnectivityGroup } from "../types"
import { getSourceTraceConnectivityTokens } from "./getSourceTraceConnectivityTokens"

export const groupSourceTracesByConnectivity = ({
  elements,
  idReplacements,
}: {
  elements: AnyCircuitElement[]
  idReplacements: Map<string, string>
}): SourceTraceConnectivityGroup[] => {
  const groups: SourceTraceConnectivityGroup[] = []

  for (const element of elements) {
    if (element.type !== "source_trace") continue
    const connectivityTokens = getSourceTraceConnectivityTokens({
      idReplacements,
      sourceTrace: element,
    })
    if (connectivityTokens.length === 0) continue
    const matchingGroups = groups.filter((group) =>
      connectivityTokens.some((token) => group.connectivityTokens.has(token)),
    )
    const canonicalGroup = matchingGroups[0]
    if (!canonicalGroup) {
      groups.push({
        connectivityTokens: new Set(connectivityTokens),
        traces: [element],
      })
      continue
    }

    canonicalGroup.traces.push(element)
    for (const token of connectivityTokens) {
      canonicalGroup.connectivityTokens.add(token)
    }
    for (const mergedGroup of matchingGroups.slice(1)) {
      canonicalGroup.traces.push(...mergedGroup.traces)
      for (const token of mergedGroup.connectivityTokens) {
        canonicalGroup.connectivityTokens.add(token)
      }
      groups.splice(groups.indexOf(mergedGroup), 1)
    }
  }

  return groups
}
