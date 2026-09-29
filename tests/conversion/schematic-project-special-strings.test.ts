import { expect, test } from "bun:test"
import { AltiumPrjPcb, parseAltiumFile, parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI LM5155EVM-FLY resolves project title-block parameters", async () => {
  const filenames = TI_EVM_REFERENCE_FILENAMES.lm5155EvmFly
  const document = parseAltiumSchDoc(
    await readReferenceBytes(filenames.schematic),
  )
  const project = parseAltiumFile(
    await readReferenceBytes(filenames.project),
  ).document
  if (!(project instanceof AltiumPrjPcb)) {
    throw new Error(`${filenames.project} is not an Altium PCB project`)
  }

  const circuitJson = convertAltiumSchDocToCircuitJson(document, {
    documentName: filenames.schematic,
    project,
    projectName: filenames.project,
  })
  const texts = circuitJson
    .filter(
      (element): element is SchematicText => element.type === "schematic_text",
    )
    .map((element) => element.text)

  expect(texts).toContain("LM5155EVM-FLY")
  expect(texts).toContain("BMC029")
  expect(texts).toContain("Public Release")
  expect(texts).toContain("2018")
  expect(texts).toContain(filenames.schematic)
  for (const reference of [
    "=PRJ_Title",
    "=PRJ_Number",
    "=PRJ_Customer",
    "=CopyrightYear",
    "=DocumentName",
  ]) {
    expect(texts).not.toContain(reference)
  }
})
