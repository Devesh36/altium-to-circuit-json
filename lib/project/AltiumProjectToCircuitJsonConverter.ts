import type { AnyCircuitElement } from "circuit-json"
import type { ConverterStage } from "../converter/ConverterStage"
import { ConvertAltiumProjectDocumentsStage } from "./stages/ConvertAltiumProjectDocumentsStage"
import { ReconcileAltiumProjectSourceIdsStage } from "./stages/ReconcileAltiumProjectSourceIdsStage"
import type {
  AltiumProjectConverterContext,
  ConvertAltiumProjectInput,
} from "./types"

export class AltiumProjectToCircuitJsonConverter {
  readonly context: AltiumProjectConverterContext = {
    elements: [],
    pcbElements: [],
    schematicElements: [],
  }
  readonly pipeline: ConverterStage<
    ConvertAltiumProjectInput,
    AnyCircuitElement[],
    AltiumProjectConverterContext
  >[]
  currentStageIndex = 0
  finished = false

  constructor(input: ConvertAltiumProjectInput) {
    this.pipeline = [
      new ConvertAltiumProjectDocumentsStage(input, this.context),
      new ReconcileAltiumProjectSourceIdsStage(input, this.context),
    ]
  }

  get currentStage() {
    return this.pipeline[this.currentStageIndex]
  }

  step(): void {
    const stage = this.currentStage
    if (!stage) {
      this.finished = true
      return
    }
    stage.step()
    if (stage.finished) {
      this.currentStageIndex++
      this.finished = this.currentStageIndex >= this.pipeline.length
    }
  }

  runUntilFinished(): void {
    while (!this.finished) this.step()
  }

  getOutput(): AnyCircuitElement[] {
    if (!this.finished) {
      throw new Error("Converter must finish before its output is read")
    }
    return this.context.elements
  }
}
