import { expect, test } from "bun:test"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { createTiEvmEmbeddedCadModelLossRepro } from "../helpers/create-ti-evm-embedded-cad-model-loss-repro"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"

test(
  "DP83825EVM loses embedded CAD models during conversion",
  async () => {
    const { circuitJson, modelSummary } =
      await createTiEvmEmbeddedCadModelLossRepro({
        pcbFilename: TI_EVM_REFERENCE_FILENAMES.dp83825Evm.pcb,
      })

    expect(modelSummary).toMatchInlineSnapshot(`
    {
      "convertedCadComponentCount": 0,
      "embeddedModelPlacementCount": 27,
      "firstConvertedCadComponent": undefined,
      "firstEmbeddedModelPlacement": {
        "layer": "top",
        "modelIndex": 0,
        "positionMils": {
          "x": 5189.9967,
          "y": 1700.0032,
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 90,
        },
        "standoffHeightMils": 0,
      },
    }
  `)
    await expectTiEvmConversion3dSnapshot({
      circuitJson,
      pcbFilename: TI_EVM_REFERENCE_FILENAMES.dp83825Evm.pcb,
      testPath: import.meta.path,
    })
  },
  { timeout: 40_000 },
)
