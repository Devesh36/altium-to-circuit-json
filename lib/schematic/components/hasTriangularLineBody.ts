import type { AltiumRecord } from "altiumts"
import { getCorner, getLocation, pointsEqual } from "../geometry"

export function hasTriangularLineBody(records: AltiumRecord[]): boolean {
  const lines = records.flatMap((record) => {
    if (record.recordKind !== "13") return []
    const start = getLocation(record)
    const end = getCorner(record)
    return start && end && !pointsEqual(start, end) ? [{ start, end }] : []
  })
  return lines.some((first) =>
    lines.some((second) => {
      const apex = pointsEqual(first.end, second.start)
        ? second.end
        : pointsEqual(first.end, second.end)
          ? second.start
          : undefined
      if (!apex) return false
      const twiceArea =
        (first.end.x - first.start.x) * (apex.y - first.start.y) -
        (first.end.y - first.start.y) * (apex.x - first.start.x)
      if (Math.abs(twiceArea) < 0.000001) return false
      return lines.some(
        (third) =>
          (pointsEqual(third.start, apex) &&
            pointsEqual(third.end, first.start)) ||
          (pointsEqual(third.end, apex) &&
            pointsEqual(third.start, first.start)),
      )
    }),
  )
}
