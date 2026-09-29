import {
  type AltiumRecord,
  type AltiumSchDoc,
  resolveSchematicParameterReferenceWithContext,
} from "altiumts"
import type { ConvertAltiumSchDocOptions } from "../../api"

export function resolveSchematicText({
  document,
  options,
  record,
  reference,
}: {
  document: AltiumSchDoc
  options: ConvertAltiumSchDocOptions
  record: AltiumRecord
  reference: string
}): string {
  return (
    resolveSchematicParameterReferenceWithContext({
      currentDate: options.currentDate,
      currentTime: options.currentTime,
      document,
      documentName: options.documentName,
      project: options.project,
      projectName: options.projectName,
      record,
      reference,
    }) ?? reference
  )
}
