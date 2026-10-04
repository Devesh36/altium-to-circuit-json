import { getAltiumPcbLayerAliasKey } from "altiumts"

const STANDARD_LAYER_LABELS: Readonly<Record<string, string>> = {
  BOTTOM: "Bottom Layer",
  BOTTOMOVERLAY: "Bottom Overlay",
  BOTTOMPASTE: "Bottom Paste",
  BOTTOMSOLDER: "Bottom Solder",
  DRILLDRAWING: "Drill Drawing",
  DRILLGUIDE: "Drill Guide",
  KEEPOUT: "Keep-Out Layer",
  MULTILAYER: "Multi-Layer",
  TOP: "Top Layer",
  TOPOVERLAY: "Top Overlay",
  TOPPASTE: "Top Paste",
  TOPSOLDER: "Top Solder",
}

export function getAltiumPcbLayerDisplayName(
  layer: string | undefined,
): string | undefined {
  if (!layer) return undefined
  const layerKey = getAltiumPcbLayerAliasKey(layer)
  const standardLabel = STANDARD_LAYER_LABELS[layerKey]
  if (standardLabel) return standardLabel

  const signalLayerOrdinal = /^MID(\d+)$/u.exec(layerKey)?.[1]
  if (signalLayerOrdinal) return `Signal Layer ${signalLayerOrdinal}`
  const planeLayerOrdinal = /^INTERNALPLANE(\d+)$/u.exec(layerKey)?.[1]
  if (planeLayerOrdinal) return `Internal Plane ${planeLayerOrdinal}`
  const mechanicalLayerOrdinal = /^MECHANICAL(\d+)$/u.exec(layerKey)?.[1]
  if (mechanicalLayerOrdinal) return `Mechanical ${mechanicalLayerOrdinal}`
  return layer.trim() || undefined
}
