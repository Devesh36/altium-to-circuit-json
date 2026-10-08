import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("does not render hidden DRV8307EVM implementation parameters", async () => {
  const source = await readReferenceBytes(
    TI_EVM_REFERENCE_FILENAMES.drv8307Evm.schematic,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const schematicTexts = circuitJson.flatMap((element) =>
    element.type === "schematic_text" ? [element.text] : [],
  )

  expect(schematicTexts).not.toContain("Excluded Parts")
  expect(schematicTexts.some((text) => text.startsWith("@DESIGNATOR"))).toBe(
    false,
  )
})
