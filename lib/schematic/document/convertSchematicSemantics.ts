import { AltiumSchImageRecord } from "altiumts"
import { SCHEMATIC_SHEET_ID } from "./constants"
import { convertSemanticSchematic } from "./convertSemanticSchematic"
import type { SchematicConversionContext } from "./types"

export function convertSchematicSemantics(
  context: SchematicConversionContext,
): void {
  const conversion = convertSemanticSchematic(context.document, {
    ...context.options,
    scale: context.scale,
    schematicSheetId: SCHEMATIC_SHEET_ID,
  })
  context.convertedPorts.push(...conversion.convertedPorts)
  context.elements.push(...conversion.elements)
  for (const record of conversion.handledRecords) {
    if (record instanceof AltiumSchImageRecord) continue
    context.handledRecords.add(record)
  }
}
