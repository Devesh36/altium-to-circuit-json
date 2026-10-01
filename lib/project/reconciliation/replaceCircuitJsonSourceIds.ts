import { getCanonicalSourceId } from "./getCanonicalSourceId"

export const replaceCircuitJsonSourceIds = ({
  circuitJsonNode,
  idReplacements,
}: {
  circuitJsonNode: unknown
  idReplacements: Map<string, string>
}): void => {
  if (!circuitJsonNode || typeof circuitJsonNode !== "object") return

  for (const [fieldName, fieldEntry] of Object.entries(circuitJsonNode)) {
    if (fieldName.endsWith("_id") && typeof fieldEntry === "string") {
      Reflect.set(
        circuitJsonNode,
        fieldName,
        getCanonicalSourceId({ id: fieldEntry, idReplacements }),
      )
      continue
    }
    if (fieldName.endsWith("_ids") && Array.isArray(fieldEntry)) {
      Reflect.set(circuitJsonNode, fieldName, [
        ...new Set(
          fieldEntry.map((id) =>
            typeof id === "string"
              ? getCanonicalSourceId({ id, idReplacements })
              : id,
          ),
        ),
      ])
      continue
    }
    replaceCircuitJsonSourceIds({
      circuitJsonNode: fieldEntry,
      idReplacements,
    })
  }
}
