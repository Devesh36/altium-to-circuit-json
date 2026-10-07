import { expect, test } from "bun:test"
import type { SchematicLine } from "circuit-json"
import { associateNoErcMarkerWithPortAtAnchor } from "../../lib/schematic/rendering/associateNoErcMarkerWithPortAtAnchor"

test("keeps an unmatched no-ERC marker unowned", () => {
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

  expect(
    associateNoErcMarkerWithPortAtAnchor({
      convertedPorts: [],
      markerAnchor: { x: 0, y: 0 },
      markerElements,
      schematicUnitScale: 1,
    }),
  ).toEqual(markerElements)
})
