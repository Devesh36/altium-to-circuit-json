import type { AnyCircuitElement } from "circuit-json"
import type { ReconciledSourceElement } from "../types"
import { isReconciledSourceElement } from "./isReconciledSourceElement"
import { mergeReconciledSourceElements } from "./mergeReconciledSourceElements"

export const deduplicateReconciledSourceElements = (
  elements: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const sourceElementsByIdentity = new Map<string, ReconciledSourceElement>()
  const deduplicatedElements: AnyCircuitElement[] = []

  for (const element of elements) {
    if (!isReconciledSourceElement(element)) {
      deduplicatedElements.push(element)
      continue
    }
    const elementId = Reflect.get(element, `${element.type}_id`)
    if (typeof elementId !== "string") {
      deduplicatedElements.push(element)
      continue
    }
    const identity = `${element.type}:${elementId}`
    const canonical = sourceElementsByIdentity.get(identity)
    if (canonical) {
      mergeReconciledSourceElements({ candidate: element, canonical })
      continue
    }
    sourceElementsByIdentity.set(identity, element)
    deduplicatedElements.push(element)
  }

  return deduplicatedElements
}
