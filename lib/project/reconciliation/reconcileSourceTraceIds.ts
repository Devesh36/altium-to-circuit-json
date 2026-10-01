import type { AnyCircuitElement } from "circuit-json"
import { groupSourceTracesByConnectivity } from "./groupSourceTracesByConnectivity"

export const reconcileSourceTraceIds = ({
  elements,
  idReplacements,
  pcbElements,
}: {
  elements: AnyCircuitElement[]
  idReplacements: Map<string, string>
  pcbElements: AnyCircuitElement[]
}): void => {
  const pcbSourceTraceIds = new Set(
    pcbElements.flatMap((element) =>
      element.type === "source_trace" ? [element.source_trace_id] : [],
    ),
  )
  const sourceTraceGroups = groupSourceTracesByConnectivity({
    elements,
    idReplacements,
  })

  for (const { traces } of sourceTraceGroups) {
    const canonical =
      traces.find((trace) => pcbSourceTraceIds.has(trace.source_trace_id)) ??
      traces[0]
    if (!canonical) continue
    for (const trace of traces) {
      if (trace === canonical) continue
      idReplacements.set(trace.source_trace_id, canonical.source_trace_id)
    }
  }
}
