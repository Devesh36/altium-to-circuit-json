import type { AnyCircuitElement } from "circuit-json"
import { ConverterStage } from "../../converter/ConverterStage"
import { reconcileAltiumProjectSourceIds } from "../reconciliation/reconcileAltiumProjectSourceIds"
import type {
  AltiumProjectConverterContext,
  ConvertAltiumProjectInput,
} from "../types"

export class ReconcileAltiumProjectSourceIdsStage extends ConverterStage<
  ConvertAltiumProjectInput,
  AnyCircuitElement[],
  AltiumProjectConverterContext
> {
  _step(): void {
    this.context.elements = reconcileAltiumProjectSourceIds({
      elements: this.context.elements,
      pcbElements: this.context.pcbElements,
    })
    this.finished = true
  }

  getOutput(): AnyCircuitElement[] {
    return this.context.elements
  }
}
