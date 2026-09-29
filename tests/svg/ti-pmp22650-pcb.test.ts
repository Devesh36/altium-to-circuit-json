import { expect, test } from "bun:test"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { createOpenSourcePcbComparison } from "../helpers/create-open-source-pcb-comparison"
import { expectImportedPcbConnections } from "../helpers/expect-imported-pcb-connections"
import { expectValidImportedPcb } from "../helpers/expect-valid-imported-pcb"

test(
  "TI PMP22650 PCB: altiumts SVG on the left, Circuit JSON SVG on the right",
  async () => {
    const { circuitJson, circuitJsonSvg, comparisonSvg, document } =
      await createOpenSourcePcbComparison({
        filename: TI_POWER_REFERENCE_PCB_FILENAMES.pmp22650,
        focusOnBoard: true,
        pcbName: "TI PMP22650",
      })

    expectValidImportedPcb({ circuitJson, circuitJsonSvg })
    expectImportedPcbConnections({
      circuitJson,
      document,
      expectedConnectionCount: 410,
      expectedInheritedCopperAreaCount: 395,
    })
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "pcb_trace" && !("source_trace_id" in element),
      ),
    ).toHaveLength(0)

    const layerSpecificKeepoutArcs = circuitJson.filter(
      (element) =>
        element.type === "pcb_keepout" && element.shape === "outline",
    )
    expect(layerSpecificKeepoutArcs).toHaveLength(159)
    expect(layerSpecificKeepoutArcs).toContainEqual(
      expect.objectContaining({
        pcb_keepout_id: "pcb_keepout_altium_arc_4291",
        layers: ["top"],
        stroke_width: 0.0254,
      }),
    )
    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 180_000 },
)
