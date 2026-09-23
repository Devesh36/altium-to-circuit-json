import { type AltiumPcbDocument, getPcbLayerStack } from "altiumts"

const DEFAULT_BOARD_THICKNESS_MM = 1.6

export function getBoardThickness(document: AltiumPcbDocument): number {
  if (!document.board) return DEFAULT_BOARD_THICKNESS_MM

  const entries = getPcbLayerStack(document.board).entries.filter(
    (entry) => entry.source === "v8",
  )
  const copperEntryIndexes = entries.flatMap((entry, index) =>
    entry.copperThickness === undefined ? [] : [index],
  )
  if (copperEntryIndexes.length < 2) return DEFAULT_BOARD_THICKNESS_MM

  const firstCopperIndex = copperEntryIndexes[0]
  const lastCopperIndex = copperEntryIndexes[copperEntryIndexes.length - 1]
  if (firstCopperIndex === undefined || lastCopperIndex === undefined) {
    return DEFAULT_BOARD_THICKNESS_MM
  }

  const stackEntries = entries.slice(firstCopperIndex, lastCopperIndex + 1)
  const copperThicknesses = stackEntries.flatMap((entry) =>
    entry.copperThickness === undefined
      ? []
      : [entry.copperThickness.toMillimeters()],
  )
  const dielectricHeights = stackEntries.flatMap((entry) =>
    entry.dielectricHeight === undefined
      ? []
      : [entry.dielectricHeight.toMillimeters()],
  )

  if (
    copperThicknesses.some(
      (thickness) => !Number.isFinite(thickness) || thickness <= 0,
    ) ||
    dielectricHeights.some(
      (height) => !Number.isFinite(height) || height <= 0,
    ) ||
    dielectricHeights.length < copperThicknesses.length - 1
  ) {
    return DEFAULT_BOARD_THICKNESS_MM
  }

  const thickness = [...copperThicknesses, ...dielectricHeights].reduce(
    (total, value) => total + value,
    0,
  )
  return thickness > 0 ? thickness : DEFAULT_BOARD_THICKNESS_MM
}
