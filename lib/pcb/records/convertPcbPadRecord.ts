import type { AltiumPadRecord } from "altiumts"
import type { PcbConversionContext } from "../model"
import { connectPcbPad, convertPcbPad } from "../pads"

export function convertPcbPadRecord({
  context,
  record,
  recordIndex,
}: {
  context: PcbConversionContext
  record: AltiumPadRecord
  recordIndex: number
}): void {
  const pad = convertPcbPad({
    layerMap: context.layerMap,
    record,
    recordIndex,
  })
  if (!pad) return
  if (pad.type === "pcb_hole") {
    context.elements.push(pad)
    return
  }
  context.elements.push(
    ...connectPcbPad({
      componentContext: context.componentContext,
      includeComponentOwnership: context.options.includeComponents !== false,
      pad,
      record,
      recordIndex,
    }),
  )
}
