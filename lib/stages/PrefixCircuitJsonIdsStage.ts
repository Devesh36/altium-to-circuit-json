import type { AnyCircuitElement } from "circuit-json"
import { ConverterStage } from "../converter/ConverterStage"
import type { SupportedAltiumDocument } from "../converter/types"
import { prefixCircuitJsonNodeIds } from "./prefixCircuitJsonNodeIds"

export class PrefixCircuitJsonIdsStage extends ConverterStage<
  SupportedAltiumDocument,
  AnyCircuitElement[]
> {
  _step(): void {
    const idPrefix = this.context.options.idPrefix
    if (!idPrefix) {
      this.finished = true
      return
    }
    for (const element of this.context.elements) {
      prefixCircuitJsonNodeIds(element, idPrefix)
    }
    this.finished = true
  }

  getOutput(): AnyCircuitElement[] {
    return this.context.elements
  }
}
