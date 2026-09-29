import type { AltiumPadRecord, AltiumPcbDocument, AltiumRecord } from "altiumts"
import type {
  AnyCircuitElement,
  SourceNet,
  SourcePort,
  SourceSimpleChip,
  SourceTrace,
} from "circuit-json"
import type { PcbCopperLayerMap } from "../layers"

export interface ConvertAltiumPcbDocOptions {
  includeBoardOutline?: boolean
  includeComponents?: boolean
  includeCopperAreas?: boolean
  includeCourtyards?: boolean
  includeDimensions?: boolean
  includeKeepouts?: boolean
  includePads?: boolean
  includeSilkscreen?: boolean
  includeTraces?: boolean
  includeVias?: boolean
}

export interface PcbNetContext {
  elements: Array<SourceNet | SourceTrace>
  getSourceNetId: (record: AltiumRecord) => string | undefined
  getSourceTraceId: (record: AltiumRecord) => string | undefined
}

export interface PcbComponentContext {
  sourceComponents: SourceSimpleChip[]
  sourcePorts: SourcePort[]
  getPcbComponentId: (record: AltiumRecord) => string | undefined
  getSourcePortId: (record: AltiumPadRecord) => string | undefined
}

export interface PcbConversionContext {
  componentContext: PcbComponentContext
  document: AltiumPcbDocument
  elements: AnyCircuitElement[]
  layerMap: PcbCopperLayerMap
  netContext: PcbNetContext
  options: ConvertAltiumPcbDocOptions
}
