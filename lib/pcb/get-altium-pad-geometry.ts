import {
  type AltiumPadRecord,
  normalizeAltiumAngle,
  parseAltiumMeasurementToMils,
} from "altiumts"

// Altium uses fixed top and bottom ordinals in its 32-entry pad-stack table.
const TOP_LAYER_ORDINAL = 0
const BOTTOM_LAYER_ORDINAL = 31

interface AltiumPadGeometry {
  cornerRadiusMils: number | undefined
  heightMils: number
  shape: string
  widthMils: number
}

interface AltiumPadHoleGeometry {
  ccwRotationDegrees: number
  offsetXMils: number
  offsetYMils: number
}

export function getAltiumPadGeometry(
  record: AltiumPadRecord,
): AltiumPadGeometry | undefined {
  const layerOrdinal = getPadStackLayerOrdinal(record)
  const isBottomLayer = layerOrdinal === BOTTOM_LAYER_ORDINAL
  const size = isBottomLayer ? (record.bottomSize ?? record.size) : record.size
  if (!size) return undefined

  const defaultShape = isBottomLayer
    ? (record.bottomShape ?? record.shape)
    : record.shape
  const alternateShape = record
    .getCaseInsensitive(`LAYER${layerOrdinal}ALTSHAPE`)
    ?.toUpperCase()
  // Conventional shapes use SHAPE/BOTTOMSHAPE; only ROUNDRECT is an override.
  const shape = alternateShape === "ROUNDRECT" ? alternateShape : defaultShape
  const cornerRadiusPercent =
    shape === "ROUNDRECT"
      ? Number(record.getCaseInsensitive(`LAYER${layerOrdinal}CORNERRADIUS`))
      : undefined
  const cornerRadiusMils =
    cornerRadiusPercent !== undefined && Number.isFinite(cornerRadiusPercent)
      ? (Math.min(size.width, size.height) * cornerRadiusPercent) / 200
      : undefined

  return {
    cornerRadiusMils,
    heightMils: size.height,
    shape: shape ?? "ROUND",
    widthMils: size.width,
  }
}

export function getAltiumPadHoleGeometry(
  record: AltiumPadRecord,
): AltiumPadHoleGeometry {
  const layerOrdinal = getPadStackLayerOrdinal(record)
  const offsetXMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEXOFFSET`, `PADXOFFSET${layerOrdinal}`],
  })
  const offsetYMils = getPadMeasurement({
    record,
    keys: [`LAYER${layerOrdinal}HOLEYOFFSET`, `PADYOFFSET${layerOrdinal}`],
  })
  // Altium stores hole offsets and rotation in the pad's local coordinates.
  const ccwPadRotationRadians = (record.rotation * Math.PI) / 180

  return {
    ccwRotationDegrees: normalizeAltiumAngle(
      record.rotation + record.holeRotation,
    ),
    offsetXMils:
      offsetXMils * Math.cos(ccwPadRotationRadians) -
      offsetYMils * Math.sin(ccwPadRotationRadians),
    offsetYMils:
      offsetXMils * Math.sin(ccwPadRotationRadians) +
      offsetYMils * Math.cos(ccwPadRotationRadians),
  }
}

export function getAltiumSlotHoleSize(record: AltiumPadRecord): {
  heightMils: number
  widthMils: number
} {
  const holeSizeMils = Math.max(record.holeSizeMils ?? 1, 1)
  const slotLengthMils =
    parseAltiumMeasurementToMils(record.getCaseInsensitive("SLOTLENGTH")) ??
    record.holeWidthMils ??
    holeSizeMils
  return {
    heightMils: holeSizeMils,
    widthMils: Math.max(slotLengthMils, holeSizeMils),
  }
}

function getPadStackLayerOrdinal(record: AltiumPadRecord): number {
  const normalizedLayer = (record.layer ?? "")
    .replace(/[\s_.-]+/gu, "")
    .toUpperCase()
  if (normalizedLayer === "BOTTOM" || normalizedLayer === "BOTTOMLAYER") {
    return BOTTOM_LAYER_ORDINAL
  }

  const innerLayer = /^(?:MIDLAYER|MID|INTERNALPLANE)(\d+)$/u.exec(
    normalizedLayer,
  )
  if (!innerLayer?.[1]) return TOP_LAYER_ORDINAL
  return Math.min(Math.max(Number(innerLayer[1]), 1), 30)
}

function getPadMeasurement({
  record,
  keys,
}: {
  record: AltiumPadRecord
  keys: readonly string[]
}): number {
  for (const key of keys) {
    const measurementMils = parseAltiumMeasurementToMils(
      record.getCaseInsensitive(key),
    )
    if (measurementMils !== undefined) return measurementMils
  }
  return 0
}
