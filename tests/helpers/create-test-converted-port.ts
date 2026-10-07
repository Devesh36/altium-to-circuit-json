import { type AltiumPoint, AltiumSchPinRecord } from "altiumts"
import type { ConvertedPort } from "../../lib/schematic/model"

export function createTestConvertedPort({
  altiumElectricalTerminal,
  renderedPortCenter,
  schematicComponentId,
  schematicSheetId,
}: {
  altiumElectricalTerminal: AltiumPoint
  renderedPortCenter: AltiumPoint
  schematicComponentId: string
  schematicSheetId: string
}): ConvertedPort {
  return {
    isSchematicVisible: true,
    point: altiumElectricalTerminal,
    record: new AltiumSchPinRecord(),
    schematicPort: {
      type: "schematic_port",
      center: renderedPortCenter,
      schematic_component_id: schematicComponentId,
      schematic_port_id: "schematic_port_test",
      schematic_sheet_id: schematicSheetId,
      source_port_id: "source_port_test",
    },
    sourcePort: {
      type: "source_port",
      name: "pin",
      source_component_id: "source_component_test",
      source_port_id: "source_port_test",
    },
  }
}
