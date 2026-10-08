import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "LM5155EVM-FLY loses embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 0,
      "embeddedModelPlacementCount": 24,
      "firstConvertedCadComponent": undefined,
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "positionMils": {
          "x": 734.1598,
          "y": 2413.998,
        },
        "rotation": {
          "x": 90,
          "y": 0,
          "z": 0,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
