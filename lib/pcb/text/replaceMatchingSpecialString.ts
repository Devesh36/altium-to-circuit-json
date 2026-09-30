import type { ProjectTextReplacement } from "./types"
import { escapeRegularExpression } from "./escapeRegularExpression"

export function replaceMatchingSpecialString({
  isQuoted,
  replacement,
  text,
}: {
  isQuoted: boolean
  replacement: ProjectTextReplacement
  text: string
}): string {
  const escapedName = escapeRegularExpression(replacement.name)
  const quotedExpression = new RegExp(`'\\.${escapedName}'`, "giu")
  if (isQuoted) {
    return text.replace(quotedExpression, () => replacement.text)
  }
  const exactReference = `.${replacement.name}`.toLowerCase()
  return text
    .split("'")
    .map((segment, index) =>
      index % 2 === 0 && segment.toLowerCase() === exactReference
        ? replacement.text
        : segment,
    )
    .join("'")
}
