import { expect, test } from "bun:test"
import type { SchematicLine } from "circuit-json"
import { associateNoErcMarkerWithPortAtAnchor } from "../../lib/schematic/rendering/associateNoErcMarkerWithPortAtAnchor"
import { createTestConvertedPort } from "../helpers/create-test-converted-port"

test("assigns a no-ERC marker at a native symbol's electrical terminal", () => {
  const markerElements = [
    {
      type: "schematic_line",
      schematic_line_id: "schematic_line_no_erc_a",
      schematic_sheet_id: "schematic_sheet_a",
      x1: -1,
      y1: 1,
      x2: 1,
      y2: -1,
      color: "#ff0000",
      is_dashed: false,
    } satisfies SchematicLine,
  ]
  const convertedPorts = [
    createTestConvertedPort({
      altiumElectricalTerminal: { x: 30, y: 50 },
      renderedPortCenter: { x: 4.7, y: 5 },
      schematicComponentId: "schematic_component_resistor",
      schematicSheetId: "schematic_sheet_a",
    }),
  ]

  const [ownedMarker] = associateNoErcMarkerWithPortAtAnchor({
    convertedPorts,
    markerAnchor: { x: 3, y: 5 },
    markerElements,
    schematicUnitScale: 0.1,
  })

  expect(ownedMarker).toMatchObject({
    schematic_component_id: "schematic_component_resistor",
    schematic_line_id: "schematic_line_no_erc_a",
  })
})
