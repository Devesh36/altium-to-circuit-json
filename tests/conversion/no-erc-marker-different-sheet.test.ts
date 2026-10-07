import { expect, test } from "bun:test"
import type { SchematicLine } from "circuit-json"
import { associateNoErcMarkerWithPortAtAnchor } from "../../lib/schematic/rendering/associateNoErcMarkerWithPortAtAnchor"
import { createTestConvertedPort } from "../helpers/create-test-converted-port"

test("does not assign a no-ERC marker to a port on another sheet", () => {
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
      altiumElectricalTerminal: { x: 0, y: 0 },
      renderedPortCenter: { x: 0, y: 0 },
      schematicComponentId: "schematic_component_other_sheet",
      schematicSheetId: "schematic_sheet_b",
    }),
  ]

  expect(
    associateNoErcMarkerWithPortAtAnchor({
      convertedPorts,
      markerAnchor: { x: 0, y: 0 },
      markerElements,
      schematicUnitScale: 1,
    }),
  ).toEqual(markerElements)
})
