import type { AltiumSchImageRecord } from "altiumts"
import type { SchematicGraphic } from "circuit-json"
import {
  SCHEMATIC_SHEET_ID,
  getAltiumSheetDimensions,
  type SchematicContext,
} from "../document"
import { getCorner, getLocation } from "../geometry"
import { createSchematicImageSvg } from "./createSchematicImageSvg"

export function renderSchematicImageRecord({
  context,
  index,
  record,
}: {
  context: SchematicContext
  index: number
  record: AltiumSchImageRecord
}): SchematicGraphic[] {
  const embeddedImage = context.document.getEmbeddedImageForRecord(record)
  const location = getLocation(record)
  const corner = getCorner(record)
  if (!embeddedImage || !location || !corner) return []

  return [
    {
      type: "schematic_graphic",
      schematic_graphic_id: `schematic_graphic_altium_${index}`,
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      svg_content: createSchematicImageSvg({
        corner,
        imageUrl: embeddedImage.getDataUrl(),
        keepAspect: record.getBoolean("KEEPASPECT") ?? true,
        location,
        sheetDimensions: getAltiumSheetDimensions(context.sheetRecord),
      }),
    },
  ]
}
