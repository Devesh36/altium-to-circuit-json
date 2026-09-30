import { doesLineIntersectLine } from "@tscircuit/math-utils"
import type { AltiumPcbContour } from "altiumts"

export function isContourInsideContour({
  innerContour,
  outerContour,
}: {
  innerContour: AltiumPcbContour
  outerContour: AltiumPcbContour
}): boolean {
  const innerBounds = innerContour.bounds
  const outerBounds = outerContour.bounds
  if (
    !innerBounds ||
    !outerBounds ||
    innerBounds.minX <= outerBounds.minX ||
    innerBounds.maxX >= outerBounds.maxX ||
    innerBounds.minY <= outerBounds.minY ||
    innerBounds.maxY >= outerBounds.maxY
  ) {
    return false
  }

  const innerPoints = innerContour.isExplicitlyClosed
    ? innerContour.points.slice(0, -1)
    : innerContour.points
  const outerPoints = outerContour.isExplicitlyClosed
    ? outerContour.points.slice(0, -1)
    : outerContour.points
  if (innerPoints.length < 3 || outerPoints.length < 3) return false
  // Allow for rounding when fractional-mil coordinates meet at a boundary.
  const toleranceMils =
    8 *
    Number.EPSILON *
    Math.max(
      1,
      Math.abs(outerBounds.minX),
      Math.abs(outerBounds.maxX),
      Math.abs(outerBounds.minY),
      Math.abs(outerBounds.maxY),
    )

  for (const point of innerPoints) {
    let isInside = false
    for (let index = 0; index < outerPoints.length; index++) {
      const start = outerPoints[index]
      const end = outerPoints[(index + 1) % outerPoints.length]
      if (!start || !end) continue
      if (
        start.y > point.y !== end.y > point.y &&
        point.x <
          start.x +
            ((point.y - start.y) * (end.x - start.x)) / (end.y - start.y)
      ) {
        isInside = !isInside
      }
    }
    if (!isInside) return false
  }

  for (let innerIndex = 0; innerIndex < innerPoints.length; innerIndex++) {
    const innerStart = innerPoints[innerIndex]
    const innerEnd = innerPoints[(innerIndex + 1) % innerPoints.length]
    if (!innerStart || !innerEnd) continue
    for (let outerIndex = 0; outerIndex < outerPoints.length; outerIndex++) {
      const outerStart = outerPoints[outerIndex]
      const outerEnd = outerPoints[(outerIndex + 1) % outerPoints.length]
      if (!outerStart || !outerEnd) continue
      if (
        doesLineIntersectLine([innerStart, innerEnd], [outerStart, outerEnd], {
          lineThickness: toleranceMils,
        })
      ) {
        return false
      }
    }
  }
  return true
}
