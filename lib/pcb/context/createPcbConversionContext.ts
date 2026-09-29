import type { AltiumPcbDocument } from "altiumts"
import { PcbCopperLayerMap } from "../layers"
import type { ConvertAltiumPcbDocOptions, PcbConversionContext } from "../model"
import { createPcbComponentContext } from "./createPcbComponentContext"
import { createPcbNetContext } from "./createPcbNetContext"

export function createPcbConversionContext({
  document,
  options,
}: {
  document: AltiumPcbDocument
  options: ConvertAltiumPcbDocOptions
}): PcbConversionContext {
  const layerMap = new PcbCopperLayerMap(document)
  const componentContext = createPcbComponentContext({
    document,
    includePorts: options.includePads !== false,
    layerMap,
  })
  return {
    componentContext,
    document,
    elements: [],
    layerMap,
    netContext: createPcbNetContext(document, componentContext),
    options,
  }
}
