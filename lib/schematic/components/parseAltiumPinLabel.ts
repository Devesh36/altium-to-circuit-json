import type { SchematicTextPart } from "circuit-json"

export interface ParsedAltiumPinLabel {
  displayText: string
  textParts?: SchematicTextPart[]
}

export function parseAltiumPinLabel(name: string): ParsedAltiumPinLabel {
  if (!name.includes("\\")) return { displayText: name }

  if (name.startsWith("\\")) {
    const displayText = name.replaceAll("\\", "")
    return {
      displayText,
      textParts: [{ is_overlined: true, text: displayText }],
    }
  }

  const textParts: SchematicTextPart[] = []
  const characters = [...name]
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? ""
    if (character === "\\") continue

    const isOverlined = characters[index + 1] === "\\"
    if (isOverlined) index += 1
    const previousTextPart = textParts.at(-1)
    if (
      previousTextPart &&
      Boolean(previousTextPart.is_overlined) === isOverlined
    ) {
      previousTextPart.text += character
    } else {
      textParts.push({
        ...(isOverlined ? { is_overlined: true } : {}),
        text: character,
      })
    }
  }

  return {
    displayText: textParts.map((textPart) => textPart.text).join(""),
    textParts,
  }
}
