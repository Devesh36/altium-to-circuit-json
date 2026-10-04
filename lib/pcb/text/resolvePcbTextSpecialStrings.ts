import type { AltiumPrjPcb } from "altiumts"
import type { PcbCopperLayerMap } from "../layers"
import { getAltiumPcbLayerDisplayName } from "../layers"
import { replaceMatchingSpecialString } from "./replaceMatchingSpecialString"
import { resolvePcbProjectSpecialStrings } from "./resolvePcbProjectSpecialStrings"

export function resolvePcbTextSpecialStrings({
  layer,
  layerMap,
  project,
  text,
}: {
  layer: string | undefined
  layerMap: PcbCopperLayerMap
  project?: AltiumPrjPcb
  text: string
}): string {
  if (!text.toLowerCase().includes(".layer_name")) {
    return resolvePcbProjectSpecialStrings({ project, text })
  }
  const layerDisplayName =
    layerMap.getDisplayName(layer) ?? getAltiumPcbLayerDisplayName(layer)
  if (!layerDisplayName)
    return resolvePcbProjectSpecialStrings({ project, text })

  const replacement = { name: "Layer_Name", text: layerDisplayName }
  const layerResolvedText = replaceMatchingSpecialString({
    isQuoted: true,
    replacement,
    text: replaceMatchingSpecialString({
      isQuoted: false,
      replacement,
      text,
    }),
  })
  return resolvePcbProjectSpecialStrings({ project, text: layerResolvedText })
}
