import type { AltiumRecord } from "altiumts"
import type { SchematicRect } from "circuit-json"
import { SCHEMATIC_SHEET_ID, type SchematicContext } from "../document"
import {
  getCoordinateOrFallback,
  getLocation,
  scaleLength,
  scalePoint,
} from "../geometry"

export function renderSheetSymbol({
  context,
  index,
  record,
}: {
  context: SchematicContext
  index: number
  record: AltiumRecord
}): SchematicRect[] {
  const location = getLocation(record)
  if (!location) return []
  const width = Math.max(
    getCoordinateOrFallback({ record, key: "XSIZE", fallback: 1 }),
    1,
  )
  const height = Math.max(
    getCoordinateOrFallback({ record, key: "YSIZE", fallback: 1 }),
    1,
  )

  return [
    {
      type: "schematic_rect",
      schematic_rect_id: `schematic_sheet_symbol_altium_${index}`,
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      center: scalePoint(
        { x: location.x + width / 2, y: location.y - height / 2 },
        context.scale,
      ),
      width: scaleLength(width, context.scale),
      height: scaleLength(height, context.scale),
      rotation: 0,
      stroke_width: Math.max(scaleLength(1, context.scale), 0.05),
      color: "#840000",
      is_filled: true,
      fill_color: "#ffffc2",
      is_dashed: false,
    },
  ]
}
