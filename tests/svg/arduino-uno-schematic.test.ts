import { expect, test } from "bun:test"
import { createArduinoSchematicComparison } from "../helpers/create-arduino-circular-symbols-comparison"
import { expectValidImportedSchematic } from "../helpers/expect-valid-imported-schematic"

test("Arduino Uno full schematic source and conversion", async () => {
  const comparison = await createArduinoSchematicComparison()
  expectValidImportedSchematic(comparison)
  await expect(comparison.comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
