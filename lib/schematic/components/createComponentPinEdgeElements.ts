import type { AltiumSchPinRecord } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import type { ConvertedPort } from "../model"
import { createAlphanumericPinDesignatorText } from "./createAlphanumericPinDesignatorText"
import { createNumericPinDesignatorText } from "./createNumericPinDesignatorText"
import { createPinClockSymbol } from "./createPinClockSymbol"
import type { ComponentConversionContext } from "./types"

export function createComponentPinEdgeElements(
  {
    componentPorts,
    includeNumericDesignators,
    pins,
  }: {
    componentPorts: ConvertedPort[]
    includeNumericDesignators: boolean
    pins: AltiumSchPinRecord[]
  },
  context: ComponentConversionContext,
): AnyCircuitElement[] {
  return componentPorts.flatMap(
    ({ isSchematicVisible, schematicPort }, pinIndex) => {
      if (!isSchematicVisible) return []
      const pin = pins[pinIndex]
      if (!pin) return []
      const edgeElementParameters = {
        pin,
        recordIndex: context.document.records.indexOf(pin),
        scale: context.options.scale,
        schematicPort,
      }
      return [
        createAlphanumericPinDesignatorText(edgeElementParameters),
        includeNumericDesignators
          ? createNumericPinDesignatorText(edgeElementParameters)
          : undefined,
        createPinClockSymbol(edgeElementParameters),
      ].filter((element) => element !== undefined)
    },
  )
}
