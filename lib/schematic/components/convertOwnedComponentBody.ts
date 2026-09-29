import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertOwnedCustomComponentBody } from "./convertOwnedCustomComponentBody"
import { convertOwnedLogicGateBody } from "./convertOwnedLogicGateBody"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedComponentBody(
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
  return (
    convertOwnedLogicGateBody(
      { identity, pins, records, visibleSymbolLabels },
      context,
    ) ?? convertOwnedCustomComponentBody({ identity, records }, context)
  )
}
