import { scaleLength } from "../geometry"
import { SCHEMATIC_SHEET_ID, SCHEMATIC_UNIT_TO_MILLIMETERS } from "./constants"
import { createSheetBorder } from "./createSheetBorder"
import type { SchematicConversionContext } from "./types"

export function addSchematicSheet(context: SchematicConversionContext): void {
  const scaledSheetWidth = scaleLength(
    context.sheetDimensions.width,
    context.scale,
  )
  const scaledSheetHeight = scaleLength(
    context.sheetDimensions.height,
    context.scale,
  )
  const usesCustomSheet =
    context.sheetRecord?.getCaseInsensitive("USECUSTOMSHEET") === "T"
  // Circuit JSON stores sheet dimensions in physical millimeters.
  const sheetDimensions = usesCustomSheet
    ? {
        sheet_width: scaledSheetWidth * SCHEMATIC_UNIT_TO_MILLIMETERS,
        sheet_height: scaledSheetHeight * SCHEMATIC_UNIT_TO_MILLIMETERS,
      }
    : {}
  context.elements.push({
    type: "schematic_sheet",
    schematic_sheet_id: SCHEMATIC_SHEET_ID,
    name: context.options.sheetName ?? "Altium schematic",
    outline_color: "#334155",
    sheet_index: 0,
    ...sheetDimensions,
  })
  if (context.options.includeSheetBorder === true) {
    context.elements.push(createSheetBorder(context.sheetRecord, context.scale))
  }
}
