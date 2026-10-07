import type { AltiumPoint } from "altiumts"
import type { AnyCircuitElement, SchematicLine } from "circuit-json"
import { pointsEqual, scalePoint } from "../geometry"
import type { ConvertedPort } from "../model"

export function associateNoErcMarkerWithPortAtAnchor({
  convertedPorts,
  markerAnchor,
  markerElements,
  schematicUnitScale,
}: {
  convertedPorts: ConvertedPort[]
  markerAnchor: AltiumPoint
  markerElements: AnyCircuitElement[]
  schematicUnitScale: number
}): AnyCircuitElement[] {
  const markerLine = markerElements.find(
    (element): element is SchematicLine => element.type === "schematic_line",
  )
  if (!markerLine) return markerElements

  const matchingPort = convertedPorts.find(
    ({ point, schematicPort }) =>
      schematicPort.schematic_sheet_id === markerLine.schematic_sheet_id &&
      pointsEqual(scalePoint(point, schematicUnitScale), markerAnchor),
  )
  const schematicComponentId =
    matchingPort?.schematicPort.schematic_component_id
  if (!schematicComponentId) return markerElements

  return markerElements.map((element) =>
    element.type === "schematic_line"
      ? { ...element, schematic_component_id: schematicComponentId }
      : element,
  )
}
