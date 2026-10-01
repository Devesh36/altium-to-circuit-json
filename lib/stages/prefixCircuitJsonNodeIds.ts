export const prefixCircuitJsonNodeIds = (
  circuitJsonNode: unknown,
  idPrefix: string,
): void => {
  if (!circuitJsonNode || typeof circuitJsonNode !== "object") return

  for (const [fieldName, fieldEntry] of Object.entries(circuitJsonNode)) {
    if (fieldName.endsWith("_id") && typeof fieldEntry === "string") {
      Reflect.set(circuitJsonNode, fieldName, `${idPrefix}_${fieldEntry}`)
      continue
    }
    if (fieldName.endsWith("_ids") && Array.isArray(fieldEntry)) {
      Reflect.set(
        circuitJsonNode,
        fieldName,
        fieldEntry.map((id) =>
          typeof id === "string" ? `${idPrefix}_${id}` : id,
        ),
      )
      continue
    }
    prefixCircuitJsonNodeIds(fieldEntry, idPrefix)
  }
}
