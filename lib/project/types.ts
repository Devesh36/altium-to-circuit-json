import type { AltiumPcbDocument, AltiumSchDoc } from "altiumts"
import type {
  AnyCircuitElement,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"
import type { ConvertAltiumSchDocOptions } from "../api/types"
import type { ConvertAltiumPcbDocOptions } from "../pcb/model"

export interface AltiumProjectPcbDocument {
  document: AltiumPcbDocument
  options?: Omit<ConvertAltiumPcbDocOptions, "idPrefix">
}

export interface AltiumProjectSchematicDocument {
  document: AltiumSchDoc
  options?: Omit<ConvertAltiumSchDocOptions, "idPrefix">
}

export interface ConvertAltiumProjectInput {
  pcb?: AltiumProjectPcbDocument
  schematics: AltiumProjectSchematicDocument[]
}

export interface AltiumProjectConverterContext {
  elements: AnyCircuitElement[]
  pcbElements: AnyCircuitElement[]
  schematicElements: AnyCircuitElement[]
}

export type ReconciledSourceComponent = Extract<
  AnyCircuitElement,
  { type: "source_component" }
>

export type ReconciledSourceElement =
  | ReconciledSourceComponent
  | SourceNet
  | SourcePort
  | SourceTrace

export interface SourceTraceConnectivityGroup {
  connectivityTokens: Set<string>
  traces: SourceTrace[]
}
