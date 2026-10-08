import { type AltiumRecord, AltiumSchPolylineRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { SymbolSelection } from "../model"
import { convertMarkedCapacitorBody } from "./convertMarkedCapacitorBody"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import { prepareOwnedComponentBodyElements } from "./prepareOwnedComponentBodyElements"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertSourceComponentBody(
  {
    identity,
    records,
    symbolSelection,
  }: {
    identity: ComponentIdentity
    records: AltiumRecord[]
    symbolSelection: SymbolSelection | undefined
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  // Altium's Res3 resistor has a complete zigzag body made from a single
  // polyline. Keep its drawing and terminal positions instead of a box.
  if (
    symbolSelection?.name.startsWith("boxresistor_") &&
    identity.libraryReference.toLowerCase() === "res3" &&
    records.some(
      (record) =>
        record instanceof AltiumSchPolylineRecord &&
        (record.getNumber("LOCATIONCOUNT") ?? 0) > 2,
    )
  ) {
    return prepareOwnedComponentBodyElements(
      convertOwnedComponentRecords(
        {
          ownedRecords: records,
          schematicComponentId: identity.schematicComponentId,
        },
        context,
      ),
    )
  }

  return convertMarkedCapacitorBody(
    { identity, records, symbolSelection },
    context,
  )
}
