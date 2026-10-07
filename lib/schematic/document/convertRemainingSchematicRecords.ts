import { getLocation, scalePoint } from "../geometry"
import { convertSchematicRecord } from "../rendering"
import { associateNoErcMarkerWithPortAtAnchor } from "../rendering/associateNoErcMarkerWithPortAtAnchor"
import { shouldRenderSchematicRecord } from "./shouldRenderSchematicRecord"
import type { SchematicConversionContext } from "./types"

export function convertRemainingSchematicRecords(
  context: SchematicConversionContext,
): void {
  for (const [recordIndex, record] of context.records.entries()) {
    if (context.handledRecords.has(record)) continue
    if (!shouldRenderSchematicRecord(record, context)) continue
    const convertedElements = convertSchematicRecord(
      { record, index: recordIndex, options: context.options },
      context,
    )
    const noErcMarkerLocation =
      record.recordKind === "22" ? getLocation(record) : undefined
    context.elements.push(
      ...(noErcMarkerLocation
        ? associateNoErcMarkerWithPortAtAnchor({
            convertedPorts: context.convertedPorts,
            markerAnchor: scalePoint(noErcMarkerLocation, context.scale),
            markerElements: convertedElements,
            schematicUnitScale: context.scale,
          })
        : convertedElements),
    )
  }
}
