import type { AltiumPrjPcb } from "altiumts"
import { getProjectTextReplacements } from "./getProjectTextReplacements"
import { replaceMatchingSpecialString } from "./replaceMatchingSpecialString"

export function resolvePcbProjectSpecialStrings({
  project,
  text,
}: {
  project?: AltiumPrjPcb
  text: string
}): string {
  if (!project || !text.includes(".")) return text
  let resolvedText = text
  const replacements = getProjectTextReplacements(project).sort(
    (first, second) => second.name.length - first.name.length,
  )
  for (const replacement of replacements) {
    resolvedText = replaceMatchingSpecialString({
      isQuoted: false,
      replacement,
      text: resolvedText,
    })
  }
  for (const replacement of replacements) {
    resolvedText = replaceMatchingSpecialString({
      isQuoted: true,
      replacement,
      text: resolvedText,
    })
  }
  return resolvedText
}
