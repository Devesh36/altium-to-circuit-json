import type { AltiumRecord } from "altiumts"
import { getBoundsCenter, scaleLength, scalePoint } from "../geometry"
import { convertOwnedComponentRecords } from "./convertOwnedComponentRecords"
import { getComponentBodyBounds } from "./getComponentBodyBounds"
import type { ComponentConversionContext, ComponentIdentity } from "./types"

export function convertPinlessComponent(
  {
    identity,
    ownedRecords,
  }: {
    identity: ComponentIdentity
    ownedRecords: AltiumRecord[]
  },
  context: ComponentConversionContext,
): void {
  const bodyBounds = getComponentBodyBounds(ownedRecords, [])
  const { elements, options } = context
  elements.push(
    {
      type: "schematic_component",
      center: scalePoint(getBoundsCenter(bodyBounds), options.scale),
      is_box_with_pins: false,
      schematic_component_id: identity.schematicComponentId,
      schematic_sheet_id: options.schematicSheetId,
      size: {
        height: Math.max(
          scaleLength(bodyBounds.maxY - bodyBounds.minY, options.scale),
          0.4,
        ),
        width: Math.max(
          scaleLength(bodyBounds.maxX - bodyBounds.minX, options.scale),
          0.4,
        ),
      },
      source_component_id: identity.sourceComponentId,
      symbol_display_value: identity.displayText,
    },
    ...convertOwnedComponentRecords(
      {
        ownedRecords,
        schematicComponentId: identity.schematicComponentId,
      },
      context,
    ),
  )
}
