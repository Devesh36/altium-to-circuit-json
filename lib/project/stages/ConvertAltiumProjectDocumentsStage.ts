import type { AnyCircuitElement } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../api/convertAltiumPcbDocToCircuitJson"
import { convertAltiumSchDocToCircuitJson } from "../../api/convertAltiumSchDocToCircuitJson"
import { ConverterStage } from "../../converter/ConverterStage"
import type {
  AltiumProjectConverterContext,
  ConvertAltiumProjectInput,
} from "../types"

export class ConvertAltiumProjectDocumentsStage extends ConverterStage<
  ConvertAltiumProjectInput,
  AnyCircuitElement[],
  AltiumProjectConverterContext
> {
  _step(): void {
    this.context.schematicElements = this.input.schematics.flatMap(
      ({ document, options }, index) =>
        convertAltiumSchDocToCircuitJson(document, {
          ...options,
          idPrefix: `schematic_${index + 1}`,
        }),
    )
    this.context.pcbElements = this.input.pcb
      ? convertAltiumPcbDocToCircuitJson(this.input.pcb.document, {
          ...this.input.pcb.options,
          idPrefix: "pcb",
        })
      : []
    this.context.elements = [
      ...this.context.schematicElements,
      ...this.context.pcbElements,
    ]
    this.finished = true
  }

  getOutput(): AnyCircuitElement[] {
    return this.context.elements
  }
}
