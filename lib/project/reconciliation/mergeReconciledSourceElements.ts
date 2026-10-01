import type { ReconciledSourceElement } from "../types"

export const mergeReconciledSourceElements = ({
  candidate,
  canonical,
}: {
  candidate: ReconciledSourceElement
  canonical: ReconciledSourceElement
}): void => {
  for (const [fieldName, fieldEntry] of Object.entries(candidate)) {
    const canonicalEntry = Reflect.get(canonical, fieldName)
    if (fieldName.endsWith("_ids") && Array.isArray(fieldEntry)) {
      Reflect.set(canonical, fieldName, [
        ...new Set([
          ...(Array.isArray(canonicalEntry) ? canonicalEntry : []),
          ...fieldEntry,
        ]),
      ])
      continue
    }
    if (canonicalEntry === undefined || canonicalEntry === null) {
      Reflect.set(canonical, fieldName, fieldEntry)
    }
  }
}
