import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import { normalizeLogicGatePinName } from "./normalizeLogicGatePinName"
import { prepareOwnedComponentBodyElements } from "./prepareOwnedComponentBodyElements"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedLogicGateBody(
  {
    identity,
    pins,
    records,
    visibleSymbolLabels,
  }: {
    identity: ComponentIdentity
    pins: AltiumSchPinRecord[]
    records: AltiumRecord[]
    visibleSymbolLabels: Set<string>
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  const logicGateLabels = new Set([
    ...visibleSymbolLabels,
    ...pins.flatMap((pin) => {
      const name = normalizeLogicGatePinName(pin.getDecoded("NAME"))
      return name ? [name] : []
    }),
  ])
  if (!["A", "B", "Y"].every((label) => logicGateLabels.has(label))) {
    return undefined
  }

  const ownedElements = convertOwnedComponentRecords(
    {
      ownedRecords: records,
      schematicComponentId: identity.schematicComponentId,
    },
    context,
  )
  if (!ownedElements.some((element) => element.type === "schematic_arc")) {
    return undefined
  }

  return prepareOwnedComponentBodyElements(ownedElements)
}
