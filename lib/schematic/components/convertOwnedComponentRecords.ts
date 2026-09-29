import {
  type AltiumRecord,
  AltiumSchImageRecord,
  AltiumSchPinRecord,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { SchematicContext } from "../document"
import { convertSchematicRecord } from "../rendering/convertSchematicRecord"
import type { ComponentConversionContext } from "./types"

export function convertOwnedComponentRecords(
  {
    ownedRecords,
    schematicComponentId,
  }: {
    ownedRecords: AltiumRecord[]
    schematicComponentId: string
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] {
  const records = context.document.records
  const renderingContext: SchematicContext = {
    document: context.document,
    records,
    scale: context.options.scale,
    sheetRecord: records.find((record) => record.recordKind === "31"),
  }

  return ownedRecords.flatMap((record) => {
    if (record instanceof AltiumSchImageRecord) return []
    const index = records.indexOf(record)
    if (index < 0) return []
    const elements = convertSchematicRecord(
      {
        index,
        options: {
          includeHidden: context.options.includeHidden,
          includeText:
            record instanceof AltiumSchPinRecord
              ? false
              : context.options.includeText,
        },
        record,
      },
      renderingContext,
    )
    return elements.map((element) =>
      element.type === "schematic_text"
        ? element
        : {
            ...element,
            schematic_component_id: schematicComponentId,
          },
    )
  })
}
