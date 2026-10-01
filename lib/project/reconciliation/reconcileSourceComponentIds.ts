import type { AnyCircuitElement } from "circuit-json"
import type { ReconciledSourceComponent } from "../types"
import { normalizeSourceIdentityName } from "./normalizeSourceIdentityName"

export const reconcileSourceComponentIds = ({
  elements,
  idReplacements,
}: {
  elements: AnyCircuitElement[]
  idReplacements: Map<string, string>
}): void => {
  const sourceComponentsByName = new Map<string, ReconciledSourceComponent>()

  for (const element of elements) {
    if (element.type !== "source_component" || !element.name) continue
    const componentName = normalizeSourceIdentityName(element.name)
    const canonical = sourceComponentsByName.get(componentName)
    if (canonical) {
      idReplacements.set(
        element.source_component_id,
        canonical.source_component_id,
      )
    } else {
      sourceComponentsByName.set(componentName, element)
    }
  }
}
