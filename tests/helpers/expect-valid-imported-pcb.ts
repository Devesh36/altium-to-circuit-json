import { expect } from "bun:test"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"

export function expectValidImportedPcb({
  circuitJson,
  circuitJsonSvg,
  requiredElementTypes = ["pcb_smtpad", "pcb_trace"],
}: {
  circuitJson: AnyCircuitElement[]
  circuitJsonSvg: string
  requiredElementTypes?: Array<AnyCircuitElement["type"]>
}): void {
  expect(
    circuitJson.filter((element) => element.type === "pcb_board"),
  ).toHaveLength(1)
  for (const elementType of requiredElementTypes) {
    expect(
      circuitJson.filter((element) => element.type === elementType).length,
    ).toBeGreaterThan(0)
  }
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
  expect(
    circuitJson
      .filter((element) => element.type === "pcb_silkscreen_text")
      .every((element) => !/^\d+(?:,\d+)+$/u.test(element.text)),
  ).toBe(true)
  expect(circuitJsonSvg).not.toContain("NaN")
}
