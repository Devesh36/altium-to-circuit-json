import { expect, test } from "bun:test"
import type { SchematicLine } from "circuit-json"
import { associateNoErcMarkerWithPortAtAnchor } from "../../lib/schematic/rendering/associateNoErcMarkerWithPortAtAnchor"
import { createTestConvertedPort } from "../helpers/create-test-converted-port"

test("does not assign a no-ERC marker at a repositioned symbol port", () => {
  const markerElements = [
    {
      type: "schematic_line",
      schematic_line_id: "schematic_line_no_erc_a",
      schematic_sheet_id: "schematic_sheet_a",
      x1: -4,
      y1: -4,
      x2: 4,
      y2: 4,
      color: "#ff0000",
      is_dashed: false,
    } satisfies SchematicLine,
  ]
  const convertedPorts = [
    createTestConvertedPort({
      altiumElectricalTerminal: { x: 30, y: 50 },
      renderedPortCenter: { x: 4.7, y: 5 },
      schematicComponentId: "schematic_component_unrelated",
      schematicSheetId: "schematic_sheet_a",
    }),
  ]

  expect(
    associateNoErcMarkerWithPortAtAnchor({
      convertedPorts,
      markerAnchor: { x: 4.7, y: 5 },
      markerElements,
      schematicUnitScale: 0.1,
    }),
  ).toEqual(markerElements)
})
