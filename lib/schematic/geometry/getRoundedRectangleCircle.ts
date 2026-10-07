import type { AltiumRecord } from "altiumts"
import { getCoordinateOrFallback } from "./getCoordinateOrFallback"
import { getRectangle } from "./getRectangle"

/** A square rounded rectangle becomes a circle when both corners reach half its size. */
export function getRoundedRectangleCircle(
  record: AltiumRecord,
): { center: { x: number; y: number }; radius: number } | undefined {
  if (record.recordKind !== "10") return undefined
  const bounds = getRectangle(record)
  if (!bounds) return undefined
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (width <= 0 || Math.abs(width - height) > 0.0001) return undefined
  const radiusX = getCoordinateOrFallback({
    record,
    key: "CORNERXRADIUS",
    fallback: 0,
  })
  const radiusY = getCoordinateOrFallback({
    record,
    key: "CORNERYRADIUS",
    fallback: radiusX,
  })
  if (radiusX < width / 2 || radiusY < height / 2) return undefined
  return {
    center: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    },
    radius: width / 2,
  }
}
