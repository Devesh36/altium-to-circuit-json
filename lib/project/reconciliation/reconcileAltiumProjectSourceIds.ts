import type { AnyCircuitElement } from "circuit-json"
import { deduplicateReconciledSourceElements } from "./deduplicateReconciledSourceElements"
import { reconcileSourceComponentIds } from "./reconcileSourceComponentIds"
import { reconcileSourceNetIds } from "./reconcileSourceNetIds"
import { reconcileSourcePortIds } from "./reconcileSourcePortIds"
import { reconcileSourceTraceIds } from "./reconcileSourceTraceIds"
import { replaceCircuitJsonSourceIds } from "./replaceCircuitJsonSourceIds"

export const reconcileAltiumProjectSourceIds = ({
  elements,
  pcbElements,
}: {
  elements: AnyCircuitElement[]
  pcbElements: AnyCircuitElement[]
}): AnyCircuitElement[] => {
  const idReplacements = new Map<string, string>()

  reconcileSourceComponentIds({ elements, idReplacements })
  reconcileSourcePortIds({ elements, idReplacements })
  reconcileSourceNetIds({ elements, idReplacements })
  reconcileSourceTraceIds({ elements, idReplacements, pcbElements })

  for (const element of elements) {
    replaceCircuitJsonSourceIds({
      circuitJsonNode: element,
      idReplacements,
    })
  }

  return deduplicateReconciledSourceElements(elements)
}
