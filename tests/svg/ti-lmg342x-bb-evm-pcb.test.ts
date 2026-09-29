import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI LMG342X-BB-EVM PCB: Altium SVG beside Circuit JSON SVG",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.pcb,
        focusOnBoard: true,
        pcbName: "TI LMG342X-BB-EVM",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
