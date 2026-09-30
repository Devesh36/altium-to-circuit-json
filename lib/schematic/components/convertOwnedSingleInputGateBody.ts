import { type AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { ConvertedPort } from "../model"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import { convertPrimitiveGatePin } from "./convertPrimitiveGatePin"
import { hasTriangularLineBody } from "./hasTriangularLineBody"
import { normalizeLogicGatePinName } from "./normalizeLogicGatePinName"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertOwnedSingleInputGateBody(
  {
    identity,
    records,
    componentPorts,
  }: {
    identity: ComponentIdentity
    records: AltiumRecord[]
    componentPorts: ConvertedPort[]
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] | undefined {
  const pinNames = componentPorts.map((port) =>
    normalizeLogicGatePinName(port.sourcePort.name),
  )
  if (
    !pinNames.includes("A") ||
    !pinNames.includes("Y") ||
    pinNames.includes("B")
  ) {
    return undefined
  }
  if (!hasTriangularLineBody(records)) return undefined

  const body = convertOwnedComponentRecords(
    {
      ownedRecords: records.filter(
        (record) => !(record instanceof AltiumSchPinRecord),
      ),
      schematicComponentId: identity.schematicComponentId,
    },
    context,
  )
  return [
    ...body,
    ...componentPorts.flatMap((port) => convertPrimitiveGatePin(port, context)),
  ]
}
