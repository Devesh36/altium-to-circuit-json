import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourceSchematicComparison } from "../helpers/create-open-source-schematic-comparison"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"

test(
  "TI LMG342X-BB-EVM hardware schematic: Altium SVG beside Circuit JSON SVG",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourceSchematicComparison({
        filename: TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.hardwareSchematic,
        projectFilename: TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.project,
        schematicName: "TI LMG342X-BB-EVM hardware",
      })

    expectValidImportedSchematic({
      circuitJson,
      circuitJsonSvg,
      requireTraces: false,
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
