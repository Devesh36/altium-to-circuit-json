import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import {
  ARDUINO_CIRCULAR_COMPONENT_NAMES,
  findArduinoComponent,
  readArduinoSchematicBytes,
} from "../helpers/create-arduino-circular-symbols-comparison"

async function convertArduino() {
  return convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(await readArduinoSchematicBytes()),
    { centerOnSchematicSheet: false, schematicUnitScale: 0.05 },
  )
}

test.failing("preserves all six Arduino circular component bodies", async () => {
  const circuitJson = await convertArduino()
  for (const name of ARDUINO_CIRCULAR_COMPONENT_NAMES) {
    const component = findArduinoComponent(circuitJson, name)
    expect(component.is_box_with_pins).toBe(false)
    expect(component.symbol_name).toBeUndefined()
    const circles = circuitJson.filter(
      (element) =>
        element.type === "schematic_circle" &&
        element.schematic_component_id === component.schematic_component_id,
    )
    expect(circles).toHaveLength(1)
    const circle = circles[0]
    if (circle?.type !== "schematic_circle") throw new Error("Missing circle")
    expect(circle.radius).toBeCloseTo(0.5, 8)
    expect(circle.color).toBe("#0000ff")
    expect(circle.is_filled).toBe(true)
    expect(circle.fill_color).toBe("#c0c0c0")
    expect(circle.center.x).toBeCloseTo(component.center.x, 8)
    expect(circle.center.y).toBeCloseTo(component.center.y, 8)
  }
})

test("retains Arduino circular component identities and single pins", async () => {
  const circuitJson = await convertArduino()
  for (const name of ARDUINO_CIRCULAR_COMPONENT_NAMES) {
    const component = findArduinoComponent(circuitJson, name)
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "source_port" &&
          element.source_component_id === component.source_component_id,
      ),
    ).toHaveLength(1)
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "schematic_port" &&
          element.schematic_component_id === component.schematic_component_id,
      ),
    ).toHaveLength(1)
  }
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
})
