import { expect, test } from "bun:test"
import {
  ARDUINO_SCHEMATIC_FILENAME,
  createArduinoMountingHoleComparison,
} from "../helpers/create-arduino-circular-symbols-comparison"
import { createOpenSourceSchematicComparison } from "../helpers/create-open-source-schematic-comparison"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"

test("Arduino Uno full schematic source and conversion", async () => {
  const comparison = await createOpenSourceSchematicComparison({
    filename: ARDUINO_SCHEMATIC_FILENAME,
    schematicName: "Arduino Uno",
  })
  expectValidImportedSchematic(comparison)
  await expect(comparison.comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})

test("Arduino Uno circular mounting-hole body detail", async () => {
  await expect(createArduinoMountingHoleComparison()).toMatchSvgSnapshot(
    import.meta.path,
    "mounting-holes",
  )
})
