import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicText } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_TMDS62LEVM_FIXTURE_NAME } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

test("TI sheet 53 preserves blank table row offsets", async () => {
  const source = await readReferenceBytes(
    `${TI_TMDS62LEVM_FIXTURE_NAME}/53.SchDoc`,
  )
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
  )
  const descriptionLines = circuitJson.filter(
    (element): element is SchematicText =>
      element.type === "schematic_text" &&
      element.schematic_text_id.startsWith(
        "schematic_text_frame_line_altium_3849_",
      ),
  )

  const visibleDescriptionLines = descriptionLines.filter((element) =>
    element.text.trim(),
  )

  expect(visibleDescriptionLines.map((element) => element.text)).toEqual([
    "Used to Power down the EVM",
    "Used to  Reset the SoC PORz",
    "Used to Reset the SoC Warmreset",
    "Used to Generate the interrupt on ",
    "GPIO0_90 Pin of SoC",
    "Connected to IO Expander to Communicate with",
    "SOC",
    "Used as nWAKEUP signal of SoC",
    "Used to Reset the Bootmode I2C IO Expander",
  ])
  expect(
    visibleDescriptionLines.map((element) => element.schematic_text_id),
  ).toEqual([
    "schematic_text_frame_line_altium_3849_0",
    "schematic_text_frame_line_altium_3849_3",
    "schematic_text_frame_line_altium_3849_6",
    "schematic_text_frame_line_altium_3849_9",
    "schematic_text_frame_line_altium_3849_10",
    "schematic_text_frame_line_altium_3849_13",
    "schematic_text_frame_line_altium_3849_14",
    "schematic_text_frame_line_altium_3849_18",
    "schematic_text_frame_line_altium_3849_22",
  ])
  expect(visibleDescriptionLines.at(-1)?.position.y).toBeCloseTo(
    (visibleDescriptionLines[0]?.position.y ?? 0) -
      22 * (visibleDescriptionLines[0]?.font_size ?? 0),
    12,
  )
})
