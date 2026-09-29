import {
  type AltiumRecord,
  AltiumSchEllipseRecord,
  AltiumSchEllipticalArcRecord,
  AltiumSchPolygonRecord,
  AltiumSchPolylineRecord,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import { prepareOwnedComponentBodyElements } from "./prepareOwnedComponentBodyElements"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedCustomComponentBody(
  {
    identity,
    records,
  }: {
    identity: ComponentIdentity
    records: AltiumRecord[]
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  const hasEllipse = records.some(
    (record) => record instanceof AltiumSchEllipseRecord,
  )
  const hasEllipticalArc = records.some(
    (record) => record instanceof AltiumSchEllipticalArcRecord,
  )
  const hasPolygon = records.some(
    (record) =>
      record instanceof AltiumSchPolygonRecord ||
      record instanceof AltiumSchPolylineRecord,
  )
  // Keep sparse decorative geometry on the generic-box path. Rich custom
  // bodies are recognized only when all three primitive families are present.
  if (!hasEllipse || !hasEllipticalArc || !hasPolygon) return undefined

  const ownedElements = convertOwnedComponentRecords(
    {
      ownedRecords: records,
      schematicComponentId: identity.schematicComponentId,
    },
    context,
  )
  return prepareOwnedComponentBodyElements(ownedElements)
}
