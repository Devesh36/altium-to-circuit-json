import type { AltiumRecord, AltiumSchComponentRecord } from "altiumts"
import type { SourceComponentDesignator } from "../model"
import { resolveSchematicText } from "../text/resolveSchematicText"
import { findOwnedDesignator } from "./findOwnedDesignator"
import { findOwnedParameterText } from "./findOwnedParameterText"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function getComponentIdentity(
  {
    componentIndex,
    componentRecord,
    ownedRecords,
  }: {
    componentIndex: number
    componentRecord: AltiumSchComponentRecord
    ownedRecords: AltiumRecord[]
  },
  context: ComponentConversionContext,
): ComponentIdentity {
  const designator =
    findOwnedDesignator(ownedRecords) ??
    componentRecord.designator ??
    `U${componentIndex}`
  const displayTextReference =
    findOwnedParameterText(ownedRecords, "Value")?.trim() ||
    findOwnedParameterText(ownedRecords, "Comment")?.trim() ||
    componentRecord.comment?.trim() ||
    componentRecord.designItemId?.trim() ||
    componentRecord.libraryReference?.trim() ||
    ""
  const displayText = resolveSchematicText({
    document: context.document,
    options: context.options,
    record: componentRecord,
    reference: displayTextReference,
  }).trim()
  const libraryReference =
    componentRecord.libraryReference ??
    componentRecord.designItemId ??
    designator
  const manufacturerPartNumber = findOwnedParameterText(
    ownedRecords,
    "Mfr_part_number",
  )
  const normalizedDesignator = designator
    .trim()
    .toUpperCase() as SourceComponentDesignator
  const existingSourceComponentId =
    context.sourceComponentIdByDesignator.get(normalizedDesignator)
  const sourceComponentId =
    existingSourceComponentId ?? `source_component_altium_${componentIndex}`
  if (!existingSourceComponentId) {
    context.sourceComponentIdByDesignator.set(
      normalizedDesignator,
      sourceComponentId,
    )
  }

  return {
    description: componentRecord.getCaseInsensitive("COMPONENTDESCRIPTION"),
    designator,
    displayText,
    libraryReference,
    manufacturerPartNumber,
    schematicComponentId: `schematic_component_altium_${componentIndex}`,
    shouldCreateSourceComponent: !existingSourceComponentId,
    sourceComponentId,
  }
}
