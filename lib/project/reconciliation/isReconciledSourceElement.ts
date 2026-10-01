import type { AnyCircuitElement } from "circuit-json"
import type { ReconciledSourceElement } from "../types"

export const isReconciledSourceElement = (
  element: AnyCircuitElement,
): element is ReconciledSourceElement =>
  element.type === "source_component" ||
  element.type === "source_net" ||
  element.type === "source_port" ||
  element.type === "source_trace"
