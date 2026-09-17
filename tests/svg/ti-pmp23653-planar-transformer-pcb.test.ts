import { expect, test } from "bun:test"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI PMP23653 planar transformer PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: TI_POWER_REFERENCE_PCB_FILENAMES.pmp23653PlanarTransformer,
        focusOnBoard: true,
        pcbName: "TI PMP23653 planar transformer",
      })

    expectValidImportedPcb({
      circuitJson,
      circuitJsonSvg,
      requiredElementTypes: ["pcb_copper_pour", "pcb_plated_hole", "pcb_via"],
    })
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 40_000 },
)
