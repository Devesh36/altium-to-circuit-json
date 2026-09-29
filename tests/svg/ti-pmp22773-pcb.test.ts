import { expect, test } from "bun:test"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectImportedPcbConnections } from "../helpers/expect-imported-pcb-connections"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI PMP22773 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg, document } =
      await createOpenSourcePcbComparison({
        filename: TI_POWER_REFERENCE_PCB_FILENAMES.pmp22773,
        focusOnBoard: true,
        pcbName: "TI PMP22773",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    expectImportedPcbConnections({
      circuitJson,
      document,
      expectedConnectionCount: 28,
      expectedInheritedCopperAreaCount: 19,
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
