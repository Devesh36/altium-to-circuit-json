import type { AltiumPrjPcb } from "altiumts"

export interface ConvertAltiumSchDocOptions {
  centerOnSchematicSheet?: boolean
  currentDate?: string
  currentTime?: string
  documentName?: string
  idPrefix?: string
  includeHidden?: boolean
  includeSheetBorder?: boolean
  includeText?: boolean
  project?: AltiumPrjPcb
  projectName?: string
  schematicUnitScale?: number
  sheetName?: string
}
