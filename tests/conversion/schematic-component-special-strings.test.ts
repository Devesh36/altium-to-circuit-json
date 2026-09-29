import { expect, test } from "bun:test"
import { AltiumPrjPcb, parseAltiumFile, parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI DRV8307EVM resolves component parameter value labels", async () => {
  const filenames = TI_EVM_REFERENCE_FILENAMES.drv8307Evm
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

  expect(texts).toContain("OSTTE080161")
  expect(texts).toContain("SN74CBT3244CPW")
  expect(texts).toContain("OSTTA034163")
  expect(texts.filter((text) => text === "=PartNumber")).toHaveLength(1)
})
