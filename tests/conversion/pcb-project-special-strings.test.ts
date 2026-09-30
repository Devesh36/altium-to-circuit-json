import { expect, test } from "bun:test"
import { parseAltiumPrjPcb } from "altiumts"
import type { PcbSilkscreenText } from "circuit-json"
import { convertAltiumToCircuitJson } from "../../lib"
import { resolvePcbProjectSpecialStrings } from "../../lib/pcb/text"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

const project = parseAltiumPrjPcb(`
[Parameter1]
Name=PRJ_Number
Value=PMP22712
[Parameter2]
Name=PCB_Rev
Value=E2
`)

test("TI PMP22712 resolves PCB project special strings", async () => {
  const source = await readReferenceBytes(
    TI_POWER_REFERENCE_PCB_FILENAMES.pmp22712,
  )
  const circuitJson = convertAltiumToCircuitJson(source, {
    pcb: { project },
    sourceType: "pcb",
  })
  const titleText = circuitJson.find(
    (element): element is PcbSilkscreenText =>
      element.type === "pcb_silkscreen_text" &&
      element.pcb_silkscreen_text_id === "pcb_silkscreen_text_altium_533",
  )

  expect(titleText?.text).toBe("PMP22712E2")
  expect(
    circuitJson.some(
      (element) =>
        element.type === "pcb_silkscreen_text" &&
        /\.PRJ_Number|\.PCB_Rev/u.test(element.text),
    ),
  ).toBe(false)
})

test("PCB project special strings respect token boundaries and parameter names", () => {
  const boundaryProject = parseAltiumPrjPcb(`
[Parameter1]
Name=Rev
Value=E2
[Parameter2]
Name=PCB Revision
Value=F3
[Parameter3]
Name=PCB-Rev
Value=G4
`)

  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: "hardware.Rev",
    }),
  ).toBe("hardware.Rev")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: "'.PCB Revision'/'.PCB-Rev'/'.Rev'",
    }),
  ).toBe("F3/G4/E2")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: "'.PCB Revision 2'",
    }),
  ).toBe("'.PCB Revision 2'")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: ".PCB Revision",
    }),
  ).toBe("F3")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: ".PCB Revision 2",
    }),
  ).toBe(".PCB Revision 2")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: ".PCB Revision.2",
    }),
  ).toBe(".PCB Revision.2")
  expect(
    resolvePcbProjectSpecialStrings({
      project: boundaryProject,
      text: ".PCB Revision/2",
    }),
  ).toBe(".PCB Revision/2")
})
