import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"
import { renderImportedSchematicToSvg } from "../helpers/render-imported-schematic"

test("keeps the TI sheet 04 viewport fitted to the schematic sheet", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/04.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const collateralLinks = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" && element.text.includes("e2e.ti.com"),
  )

  expect(collateralLinks.length).toBeGreaterThan(0)

  const svg = renderImportedSchematicToSvg(circuitJson)
  const screenScale = Number(
    svg.match(/data-real-to-screen-transform="matrix\(([^,]+)/u)?.[1],
  )
  expect(screenScale).toBeGreaterThan(20)
})
