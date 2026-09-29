import { expect } from "bun:test"
import { type AnyCircuitElement, any_circuit_element } from "circuit-json"
import { findDetachedSymbolPortIds } from "./find-detached-symbol-ports"

export function expectValidImportedSchematic({
  circuitJson,
  circuitJsonSvg,
  requireTraces = true,
}: {
  circuitJson: AnyCircuitElement[]
  circuitJsonSvg: string
  requireTraces?: boolean
}): void {
  expect(
    circuitJson.filter((element) => element.type === "schematic_sheet"),
  ).toHaveLength(1)
  if (requireTraces) {
    expect(
      circuitJson.filter((element) => element.type === "schematic_trace")
        .length,
    ).toBeGreaterThan(0)
  }
  expect(
    circuitJson.filter((element) => element.type === "schematic_text").length,
  ).toBeGreaterThan(0)
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
  expect(findDetachedSymbolPortIds(circuitJson)).toEqual([])
  expect(circuitJsonSvg).toContain('data-circuit-json-type="schematic_sheet"')
  expect(circuitJsonSvg).not.toContain("Could not match ports")
  expect(circuitJsonSvg).not.toContain("Symbol not found")
  const svgWithoutDataUris = circuitJsonSvg.replace(
    /\b(?:href|src)="data:[^"]*"/gu,
    "",
  )
  expect(svgWithoutDataUris).not.toContain("NaN")
}
