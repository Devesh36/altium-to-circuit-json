import type { AltiumPoint } from "altiumts"
import type { SheetDimensions } from "../document"

export function createSchematicImageSvg({
  corner,
  imageUrl,
  keepAspect,
  location,
  sheetDimensions,
}: {
  corner: AltiumPoint
  imageUrl: string
  keepAspect: boolean
  location: AltiumPoint
  sheetDimensions: SheetDimensions
}): string {
  const minX = Math.min(location.x, corner.x)
  const maxX = Math.max(location.x, corner.x)
  const minY = Math.min(location.y, corner.y)
  const maxY = Math.max(location.y, corner.y)
  const width = maxX - minX
  const height = maxY - minY
  const svgY = sheetDimensions.height - maxY
  const aspect = keepAspect ? "xMidYMid meet" : "none"

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetDimensions.width} ${sheetDimensions.height}">`,
    `<image href="${imageUrl}" x="${minX}" y="${svgY}" width="${width}" height="${height}" preserveAspectRatio="${aspect}"/>`,
    "</svg>",
  ].join("")
}
