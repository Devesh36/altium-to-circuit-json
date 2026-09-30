import type { AltiumPrjPcb } from "altiumts"
import type { ProjectTextReplacement } from "./types"

export function getProjectTextReplacements(
  project: AltiumPrjPcb,
): ProjectTextReplacement[] {
  const replacements: ProjectTextReplacement[] = []
  for (const section of project.sections) {
    if (/^PARAMETER\d+$/iu.test(section.name)) {
      const name = section.entries.find(
        (entry) => entry.key.toUpperCase() === "NAME",
      )?.value
      const text = section.entries.find(
        (entry) => entry.key.toUpperCase() === "VALUE",
      )?.value
      if (name && text !== undefined && text !== "*") {
        replacements.push({ name, text })
      }
      continue
    }

    if (!/^PARAMETERS?$/iu.test(section.name)) continue
    for (const entry of section.entries) {
      const separatorIndex = entry.value.indexOf("=")
      if (separatorIndex <= 0) continue
      const name = entry.value.slice(0, separatorIndex).trim()
      const text = entry.value.slice(separatorIndex + 1)
      if (name && text !== "*") replacements.push({ name, text })
    }
  }
  return replacements
}
