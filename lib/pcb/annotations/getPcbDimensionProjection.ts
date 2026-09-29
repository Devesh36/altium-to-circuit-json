import type { AltiumDimensionRecord, AltiumPoint } from "altiumts"
import { getDimensionAxis } from "./getDimensionAxis"

export interface PcbDimensionProjection {
  axis: ReturnType<typeof getDimensionAxis>
  lengthMils: number
  projectedEnd: AltiumPoint
  referenceEnd: AltiumPoint
  referenceStart: AltiumPoint
}

export function getPcbDimensionProjection(
  record: AltiumDimensionRecord,
): PcbDimensionProjection | undefined {
  const referenceStart = record.start
  const referenceEnd = record.end
  if (!referenceStart || !referenceEnd) return undefined

  const axis = getDimensionAxis(record)
  const deltaX = referenceEnd.x - referenceStart.x
  const deltaY = referenceEnd.y - referenceStart.y
  const signedLengthMils = deltaX * axis.x + deltaY * axis.y
  const lengthMils = Math.abs(signedLengthMils)
  if (lengthMils === 0) return undefined

  return {
    axis,
    lengthMils,
    projectedEnd: {
      x: referenceStart.x + axis.x * signedLengthMils,
      y: referenceStart.y + axis.y * signedLengthMils,
    },
    referenceEnd,
    referenceStart,
  }
}
