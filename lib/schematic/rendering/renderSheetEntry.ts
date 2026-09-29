import type { AltiumRecord } from "altiumts"
import type {
  AnyCircuitElement,
  SchematicPath,
  SchematicText,
} from "circuit-json"
import { SCHEMATIC_SHEET_ID, type SchematicContext } from "../document"
import {
  getCoordinateOrFallback,
  getLocation,
  scaleLength,
  scalePoint,
} from "../geometry"
import { createDirectText } from "../text"
import type { SymbolRenderOptions } from "./types"

export function renderSheetEntry({
  context,
  index,
  options,
  record,
}: {
  context: SchematicContext
  index: number
  options: SymbolRenderOptions
  record: AltiumRecord
}): AnyCircuitElement[] {
  const sheetSymbol = context.document.getParent(record)
  const sheetLocation = sheetSymbol ? getLocation(sheetSymbol) : undefined
  if (!sheetSymbol || sheetSymbol.recordKind !== "15" || !sheetLocation) {
    return []
  }
  const sheetWidth = Math.max(
    getCoordinateOrFallback({ record: sheetSymbol, key: "XSIZE", fallback: 1 }),
    1,
  )
  const sheetHeight = Math.max(
    getCoordinateOrFallback({ record: sheetSymbol, key: "YSIZE", fallback: 1 }),
    1,
  )
  const distance = Math.max(record.getNumber("DISTANCEFROMTOP") ?? 0, 0) * 10
  const rawSide = Math.round(record.getNumber("SIDE") ?? 0)
  const side = rawSide === 1 || rawSide === 2 || rawSide === 3 ? rawSide : 0
  const point =
    side === 1
      ? { x: sheetLocation.x + sheetWidth, y: sheetLocation.y - distance }
      : side === 2
        ? { x: sheetLocation.x + distance, y: sheetLocation.y }
        : side === 3
          ? {
              x: sheetLocation.x + distance,
              y: sheetLocation.y - sheetHeight,
            }
          : { x: sheetLocation.x, y: sheetLocation.y - distance }
  const points =
    side === 1
      ? [
          { x: point.x, y: point.y + 4 },
          { x: point.x - 7, y: point.y },
          { x: point.x, y: point.y - 4 },
        ]
      : side === 2
        ? [
            { x: point.x - 4, y: point.y },
            { x: point.x, y: point.y - 7 },
            { x: point.x + 4, y: point.y },
          ]
        : side === 3
          ? [
              { x: point.x - 4, y: point.y },
              { x: point.x, y: point.y + 7 },
              { x: point.x + 4, y: point.y },
            ]
          : [
              { x: point.x, y: point.y + 4 },
              { x: point.x + 7, y: point.y },
              { x: point.x, y: point.y - 4 },
            ]
  const elements: AnyCircuitElement[] = [
    {
      type: "schematic_path",
      schematic_path_id: `schematic_sheet_entry_altium_${index}`,
      schematic_sheet_id: SCHEMATIC_SHEET_ID,
      points: points.map((entryPoint) => scalePoint(entryPoint, context.scale)),
      stroke_width: Math.max(scaleLength(1, context.scale), 0.05),
      stroke_color: "#840000",
      fill_color: "#ffffc2",
      is_filled: true,
      is_dashed: false,
    } satisfies SchematicPath,
  ]
  const name = record.getDecoded("NAME")
  if (!name || options.includeText === false) return elements
  const fontId = Math.max(Math.round(record.getNumber("TEXTFONTID") ?? 1), 1)
  const fontSize = Math.max(
    Number(context.sheetRecord?.getCaseInsensitive(`SIZE${fontId}`) ?? 9),
    1,
  )
  const textLocation =
    side === 0
      ? { x: point.x + 9, y: point.y }
      : side === 1
        ? { x: point.x - 9, y: point.y }
        : side === 2
          ? { x: point.x, y: point.y - 9 }
          : { x: point.x, y: point.y + 9 }
  const anchor: SchematicText["anchor"] =
    side === 0
      ? "center_left"
      : side === 1
        ? "center_right"
        : side === 2
          ? "top_center"
          : "bottom_center"
  elements.push(
    createDirectText({
      id: `schematic_sheet_entry_text_altium_${index}`,
      text: name,
      location: textLocation,
      fontSize,
      color: "#840000",
      scale: context.scale,
      ccwRotationDegrees: 0,
      anchor,
    }),
  )
  return elements
}
