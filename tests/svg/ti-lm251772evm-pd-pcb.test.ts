import { expect, test } from "bun:test"
import type { PCBFabricationNotePath } from "circuit-json"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI LM251772EVM-PD PCB: Altium SVG beside Circuit JSON SVG",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg } =
      await createOpenSourcePcbComparison({
        filename: TI_EVM_REFERENCE_FILENAMES.lm251772EvmPd.pcb,
        focusOnBoard: true,
        pcbName: "TI LM251772EVM-PD",
        showSolderMask: true,
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    const dimensions = circuitJson.filter(
      (element) => element.type === "pcb_fabrication_note_dimension",
    )
    expect(dimensions).toHaveLength(3)
    expect(
      dimensions.every(
        (dimension) =>
          Math.abs(dimension.from.x - dimension.to.x) < 1e-9 ||
          Math.abs(dimension.from.y - dimension.to.y) < 1e-9,
      ),
    ).toBe(true)
    const referenceExtensionPaths = circuitJson.filter(
      (element): element is PCBFabricationNotePath =>
        element.type === "pcb_fabrication_note_path" &&
        element.pcb_fabrication_note_path_id.includes("_dimension_"),
    )
    expect(referenceExtensionPaths).toHaveLength(2)
    expect(
      referenceExtensionPaths.every((path) => path.route.length === 2),
    ).toBe(true)
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
