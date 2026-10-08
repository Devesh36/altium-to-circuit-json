import { AltiumComponentBodyRecord, parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent, CircuitJson, Point, Point3 } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "./read-reference"

interface TiEvmEmbeddedCadModelSummary {
  convertedCadComponentCount: number
  embeddedModelPlacementCount: number
  firstConvertedCadComponent:
    | {
        layer: CadComponent["layer"]
        modelStepUrl: CadComponent["model_step_url"]
        position: Point3
        rotation: Point3 | undefined
      }
    | undefined
  firstEmbeddedModelPlacement: {
    layer: "bottom" | "top"
    modelIndex: number
    positionMils: Point
    rotation: Point3
    standoffHeightMils: number
  }
}

interface TiEvmEmbeddedCadModelRepro {
  circuitJson: CircuitJson
  modelSummary: TiEvmEmbeddedCadModelSummary
}

export async function createTiEvmEmbeddedCadModelLossRepro({
  pcbFilename,
}: {
  pcbFilename: string
}): Promise<TiEvmEmbeddedCadModelRepro> {
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(pcbFilename),
  )
  const embeddedModelBodies = document.componentBodies.filter(
    (componentBody) =>
      componentBody instanceof AltiumComponentBodyRecord &&
      componentBody.modelPosition !== undefined &&
      componentBody.componentIndex !== undefined &&
      document.getEmbeddedModelForComponentBody(componentBody) !== undefined,
  ) as AltiumComponentBodyRecord[]
  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const firstEmbeddedModelBody = embeddedModelBodies[0]
  if (!firstEmbeddedModelBody?.modelPosition) {
    throw new Error(`${pcbFilename} has no embedded model placement`)
  }
  const firstEmbeddedModel = document.getEmbeddedModelForComponentBody(
    firstEmbeddedModelBody,
  )
  const firstComponent = document.getComponentForRecord(firstEmbeddedModelBody)
  if (!firstEmbeddedModel || !firstComponent) {
    throw new Error(`${pcbFilename} has an unresolved embedded model placement`)
  }
  const firstConvertedCadComponent = circuitJson.find(
    (element): element is CadComponent => element.type === "cad_component",
  )

  return {
    circuitJson,
    modelSummary: {
      convertedCadComponentCount: circuitJson.filter(
        (element) => element.type === "cad_component",
      ).length,
      embeddedModelPlacementCount: embeddedModelBodies.length,
      firstConvertedCadComponent: firstConvertedCadComponent
        ? {
            layer: firstConvertedCadComponent.layer,
            modelStepUrl: firstConvertedCadComponent.model_step_url,
            position: firstConvertedCadComponent.position,
            rotation: firstConvertedCadComponent.rotation,
          }
        : undefined,
      firstEmbeddedModelPlacement: {
        layer: firstComponent.side === "bottom" ? "bottom" : "top",
        modelIndex: firstEmbeddedModel.index,
        positionMils: firstEmbeddedModelBody.modelPosition,
        rotation: firstEmbeddedModelBody.modelRotation3d,
        standoffHeightMils: firstEmbeddedModelBody.standoffHeightMils ?? 0,
      },
    },
  }
}
