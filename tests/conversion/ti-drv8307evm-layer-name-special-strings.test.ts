import { expect, test } from "bun:test"
import { convertAltiumToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI DRV8307EVM resolves PCB layer-name special strings", async () => {
  const circuitJson = convertAltiumToCircuitJson(
    await readReferenceBytes(TI_EVM_REFERENCE_FILENAMES.drv8307Evm.pcb),
    { sourceType: "pcb" },
  )
  const layerLabels = circuitJson.flatMap((element) => {
    if (
      element.type !== "pcb_copper_text" &&
      element.type !== "pcb_silkscreen_text"
    ) {
      return []
    }
    return [element.text]
  })

  expect(layerLabels).toContain("Top Layer")
  expect(layerLabels).toContain("Bottom Layer")
  expect(layerLabels).toContain("Top Overlay")
  expect(layerLabels).toContain("Bottom Overlay")
  expect(layerLabels.some((text) => /\.Layer_Name/iu.test(text))).toBe(false)
})
