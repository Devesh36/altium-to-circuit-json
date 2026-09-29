import type { AltiumRecord, AltiumSchPinRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertSchematicArcToPath } from "../rendering/convertSchematicArcToPath"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
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
      const name = pin.getDecoded("NAME")?.trim().toUpperCase()
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

  return ownedElements
    .map((element) =>
      element.type === "schematic_arc"
        ? convertSchematicArcToPath(element)
        : element,
    )
    .sort((left, right) => {
      const leftIsFilled =
        "is_filled" in left && left.is_filled === true ? 1 : 0
      const rightIsFilled =
        "is_filled" in right && right.is_filled === true ? 1 : 0
      return rightIsFilled - leftIsFilled
    })
}
