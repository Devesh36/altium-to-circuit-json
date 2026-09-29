import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"

const DEFAULT_SCHEMATIC_FONT_ID = 0
const DEFAULT_SCHEMATIC_FONT_SIZE = 10
const PIN_CUSTOM_FONT_ID_FLAG = 0x10

const readSchematicInteger = (
  raw: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback
}

export function getAltiumPinNameFontSize({
  pin,
  sheetRecord,
}: {
  pin: AltiumSchPinRecord
  sheetRecord: AltiumRecord | undefined
}): number {
  const systemFontId = readSchematicInteger(
    sheetRecord?.getCaseInsensitive("SYSTEMFONT"),
    DEFAULT_SCHEMATIC_FONT_ID,
  )
  const namePositionFlags = readSchematicInteger(
    pin.getCaseInsensitive("PINNAME_POSITIONCONGLOMERATE"),
    0,
  )
  const hasCustomNameFont = (namePositionFlags & PIN_CUSTOM_FONT_ID_FLAG) !== 0
  const recordFontId = readSchematicInteger(
    pin.getCaseInsensitive("FONTID"),
    systemFontId,
  )
  const isLegacyPin =
    pin.getCaseInsensitive("PINNAME_POSITIONCONGLOMERATE") === undefined &&
    pin.getCaseInsensitive("PINDESIGNATOR_POSITIONCONGLOMERATE") === undefined
  const hasLegacyFont =
    sheetRecord?.getCaseInsensitive(`SIZE${recordFontId}`) !== undefined
  const inheritedFontId =
    isLegacyPin && hasLegacyFont ? recordFontId : systemFontId
  const requestedFontId = hasCustomNameFont
    ? readSchematicInteger(
        pin.getCaseInsensitive("NAME_CUSTOMFONTID"),
        systemFontId,
      )
    : inheritedFontId
  const fontId = requestedFontId > 0 ? requestedFontId : systemFontId
  const selectedSize = readSchematicInteger(
    sheetRecord?.getCaseInsensitive(`SIZE${fontId}`),
    DEFAULT_SCHEMATIC_FONT_SIZE,
  )
  return selectedSize > 0 ? selectedSize : DEFAULT_SCHEMATIC_FONT_SIZE
}
