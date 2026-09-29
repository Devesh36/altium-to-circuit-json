import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test.each([0.005, 0.01, 0.1])(
  "small schematic text follows the document scale %s",
  (schematicUnitScale) => {
    const document = parseAltiumSchDoc(
      [
        "|RECORD=31|CUSTOMX=2020|CUSTOMY=1520|SIZE1=7|SIZE2=14",
        "|RECORD=4|LOCATION.X=10|LOCATION.Y=20|FONTID=1|TEXT=Small note",
        "|RECORD=4|LOCATION.X=10|LOCATION.Y=40|FONTID=2|TEXT=Large note",
        "|RECORD=28|LOCATION.X=10|LOCATION.Y=50|CORNER.X=200|CORNER.Y=70|FONTID=1|TEXT=Frame note",
        "|RECORD=1|LIBREFERENCE=Hardware|CURRENTPARTID=1|LOCATION.X=100|LOCATION.Y=100",
        "|RECORD=14|OWNERINDEX=4|OWNERPARTID=1|LOCATION.X=100|LOCATION.Y=100|CORNER.X=120|CORNER.Y=120",
        "|RECORD=34|OWNERINDEX=4|OWNERPARTID=1|LOCATION.X=100|LOCATION.Y=125|FONTID=1|TEXT=ACC1",
        "|RECORD=41|OWNERINDEX=4|OWNERPARTID=1|LOCATION.X=100|LOCATION.Y=90|FONTID=1|NAME=Comment|TEXT=Mounting hardware",
      ].join("\n"),
    )
    const circuitJson = convertAltiumSchDocToCircuitJson(document, {
      centerOnSchematicSheet: false,
      schematicUnitScale,
    })
    const texts = circuitJson.filter(
      (element) => element.type === "schematic_text",
    )

    expect(texts).toHaveLength(5)
    for (const text of texts) {
      const sourceFontSize = text.text === "Large note" ? 14 : 7
      expect(text.font_size).toBeCloseTo(sourceFontSize * schematicUnitScale)
    }
    expect(texts.find((text) => text.text === "ACC1")).toMatchObject({
      position: { x: 100 * schematicUnitScale, y: 125 * schematicUnitScale },
    })
    expect(
      circuitJson.every(
        (element) => any_circuit_element.safeParse(element).success,
      ),
    ).toBe(true)
  },
)

test("TI mounting hardware labels retain their source size below 0.2", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/57.SchDoc`,
  )
  const document = parseAltiumSchDoc(source)
  const circuitJson = convertAltiumSchDocToCircuitJson(document)
  const texts = circuitJson.filter(
    (element) => element.type === "schematic_text",
  )
  const heading = texts.find((text) => text.text === "MOUNTING HARDWARE")
  expect(heading).toBeDefined()
  if (!heading) throw new Error("Missing mounting hardware heading")

  // The source sheet uses 40 for its heading, 7 for fiducials, and 10 for
  // the remaining visible hardware designators.
  // Compare proportions so page fitting cannot silently enlarge small text.
  const labelSize = (heading.font_size * 7) / 40
  expect(labelSize).toBeLessThan(0.2)
  for (const name of [
    "ACC1",
    "ACC2",
    "ACC3",
    "ACC4",
    "ACC5",
    "FID1",
    "FID2",
    "FID3",
    "FID4",
    "FID5",
    "FID6",
    "LBL1",
    "LBL2",
    "MH3",
    "MH5",
    "ACC10",
    "ACC11",
    "ACC12",
    "ACC13",
    "ACC14",
  ]) {
    const label = texts.find((text) => text.text === name)
    expect(label, name).toBeDefined()
    const sourceFontSize = name.startsWith("FID") ? 7 : 10
    expect(label?.font_size, name).toBeCloseTo(
      (heading.font_size * sourceFontSize) / 40,
      8,
    )
  }
  const fiducialComments = texts.filter((text) => text.text === "FID_40X80")
  expect(fiducialComments).toHaveLength(6)
  for (const text of fiducialComments) {
    expect(text.font_size).toBeCloseTo(labelSize)
  }
})
