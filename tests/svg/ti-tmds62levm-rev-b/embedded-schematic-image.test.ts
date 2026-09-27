import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../../helpers/read-reference"
import { renderImportedSchematicToSvg } from "../../helpers/render-imported-schematic"

test("TMDS62LEVM sheet 05 embedded schematic image", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/05.SchDoc`,
  )
  const document = parseAltiumSchDoc(source)
  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  const renderedSvg = renderImportedSchematicToSvg(circuitJson)

  expect(renderedSvg).toContain('data-circuit-json-type="schematic_graphic"')
  await expect(renderedSvg).toMatchSvgSnapshot(import.meta.path)
})
