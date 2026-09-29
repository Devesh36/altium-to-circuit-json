import {
  AltiumPrjPcb,
  parseAltiumFile,
  parseAltiumSchDoc,
  serializeAltiumSheetToSvg,
} from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertAltiumToCircuitJson } from "../../lib"
import { readReferenceBytes } from "./read-reference"
import { renderImportedSchematicToSvg } from "./render-imported-schematic"
import { stackAltiumAndCircuitJsonSvgs } from "./stack-svg-comparison"

export interface OpenSourceSchematicComparison {
  circuitJson: AnyCircuitElement[]
  circuitJsonSvg: string
  comparisonSvg: string
}

export async function createOpenSourceSchematicComparison({
  filename,
  projectFilename,
  schematicName,
}: {
  filename: string
  projectFilename?: string
  schematicName: string
}): Promise<OpenSourceSchematicComparison> {
  const source = await readReferenceBytes(filename)
  const document = parseAltiumSchDoc(source)
  let project: AltiumPrjPcb | undefined
  if (projectFilename) {
    const parsedProject = parseAltiumFile(
      await readReferenceBytes(projectFilename),
    ).document
    if (!(parsedProject instanceof AltiumPrjPcb)) {
      throw new Error(`${projectFilename} is not an Altium PCB project`)
    }
    project = parsedProject
  }
  const circuitJson = convertAltiumToCircuitJson(source, {
    sourceType: "schematic",
    schematic: {
      documentName: filename,
      project,
      projectName: projectFilename,
      sheetName: schematicName,
    },
  })
  const altiumSvg = serializeAltiumSheetToSvg(document, {
    documentName: filename,
    height: 600,
    project,
    projectName: projectFilename,
    title: "altiumts source rendering",
    width: 800,
  })
  const circuitJsonSvg = renderImportedSchematicToSvg(circuitJson)
  const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
    altiumSvg,
    circuitJsonSvg,
    label: `${schematicName} schematic`,
  })

  return { circuitJson, circuitJsonSvg, comparisonSvg }
}
