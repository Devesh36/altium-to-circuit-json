import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { AnyCircuitElement } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { TI_EVM_REFERENCE_FILENAMES } from "../../scripts/references/reference-manifest"
import { readReferenceBytes } from "../helpers/read-reference"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>
type SchematicComponent = Extract<
  AnyCircuitElement,
  { type: "schematic_component" }
>

test("preserves prefixed multipart logic-gate bodies in LMG342X-BB-EVM", async () => {
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(
      await readReferenceBytes(
        TI_EVM_REFERENCE_FILENAMES.lmg342xBbEvm.schematic,
      ),
    ),
  )

  for (const { name, gatePartCount } of [
    { name: "U1", gatePartCount: 2 },
    { name: "U2", gatePartCount: 2 },
    { name: "U3", gatePartCount: 3 },
    { name: "U5", gatePartCount: 3 },
  ]) {
    const source = findSourceComponent(circuitJson, name)
    const parts = circuitJson.filter(
      (element): element is SchematicComponent =>
        element.type === "schematic_component" &&
        element.source_component_id === source.source_component_id,
    )
    const gateParts = parts.filter(
      (component) => component.is_box_with_pins === false,
    )
    const powerParts = parts.filter(
      (component) => component.is_box_with_pins === true,
    )

    expect(gateParts).toHaveLength(gatePartCount)
    expect(powerParts).toHaveLength(1)
    expect(
      gateParts.every((component) =>
        circuitJson.some(
          (element) =>
            (element.type === "schematic_line" ||
              element.type === "schematic_path") &&
            element.schematic_component_id === component.schematic_component_id,
        ),
      ),
    ).toBe(true)
  }

  const u3 = findSourceComponent(circuitJson, "U3")
  const u3PinNames = circuitJson.flatMap((element) =>
    element.type === "source_port" &&
    element.source_component_id === u3.source_component_id &&
    element.name
      ? [element.name]
      : [],
  )
  expect(u3PinNames).toEqual(
    expect.arrayContaining(["1A", "1Y", "2A", "2Y", "3A", "3Y"]),
  )
})

function findSourceComponent(
  circuitJson: AnyCircuitElement[],
  name: string,
): SourceComponent {
  const component = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" && element.name === name,
  )
  if (!component) throw new Error(`Missing source component ${name}`)
  return component
}
