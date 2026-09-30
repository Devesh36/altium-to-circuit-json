import type { AltiumRecord } from "altiumts"
import { getPositiveNumber } from "./getPositiveNumber"
import type { SheetDimensions } from "./types"

const STANDARD_SHEET_SIZES: ReadonlyArray<SheetDimensions> = [
  { width: 1150, height: 760 },
  { width: 1550, height: 1110 },
  { width: 2230, height: 1570 },
  { width: 3150, height: 2230 },
  { width: 4460, height: 3150 },
  { width: 950, height: 750 },
  { width: 1500, height: 950 },
  { width: 2000, height: 1500 },
  { width: 3200, height: 2000 },
  { width: 4200, height: 3200 },
  { width: 1100, height: 850 },
  { width: 1400, height: 850 },
  { width: 1700, height: 1100 },
  { width: 990, height: 790 },
  { width: 1540, height: 990 },
  { width: 2060, height: 1560 },
  { width: 3260, height: 2060 },
  { width: 4280, height: 3280 },
]

export function getAltiumSheetDimensions(
  sheetRecord: AltiumRecord | undefined,
): SheetDimensions {
  const customDimensions = {
    width: getPositiveNumber(sheetRecord?.getCaseInsensitive("CUSTOMX"), 1000),
    height: getPositiveNumber(sheetRecord?.getCaseInsensitive("CUSTOMY"), 800),
  }
  const sheetStyle = sheetRecord?.getCaseInsensitive("SHEETSTYLE")
  if (
    sheetRecord?.getCaseInsensitive("USECUSTOMSHEET") === "T" ||
    sheetStyle === undefined
  ) {
    return customDimensions
  }

  const standardDimensions = STANDARD_SHEET_SIZES[Number(sheetStyle)]
  if (!standardDimensions) {
    throw new RangeError(
      `Unsupported Altium schematic sheet style: ${sheetStyle}`,
    )
  }
  const isPortrait =
    Number(sheetRecord?.getCaseInsensitive("WORKSPACEORIENTATION") ?? 0) !== 0
  return isPortrait
    ? { width: standardDimensions.height, height: standardDimensions.width }
    : standardDimensions
}
