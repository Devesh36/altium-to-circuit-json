import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourceSchematicComparison } from "../helpers/create-open-source-schematic-comparison"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"

test(
  "TI LM5155EVM-FLY schematic: Altium SVG beside Circuit JSON SVG",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourceSchematicComparison({
        filename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.schematic,
        projectFilename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.project,
        schematicName: "TI LM5155EVM-FLY",
      })

    expectValidImportedSchematic({ circuitJson, circuitJsonSvg })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
