import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

function convertBody(body: string[]) {
  const owned = (record: string) => `${record}|OwnerIndex=1|OwnerPartId=1`
  const source = [
    "|RECORD=31|CustomX=100|CustomY=100|Size1=10|FontName1=Arial",
    "|RECORD=1|LibReference=CustomGraphic|Designator=J1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=50|Location.Y=50|CurrentPartId=1|AllPinCount=1",
    owned(
      "|RECORD=2|Location.X=40|Location.Y=50|Name=1|Designator=1|PinLength=5|Electrical=4|PinConglomerate=34",
    ),
    ...body.map(owned),
  ].join("\n")
  const circuitJson = convertAltiumSchDocToCircuitJson(
    parseAltiumSchDoc(source),
    {
      centerOnSchematicSheet: false,
      schematicUnitScale: 0.1,
    },
  )
  const component = circuitJson.find(
    (element) => element.type === "schematic_component",
  )
  if (component?.type !== "schematic_component")
    throw new Error("Missing component")
  const graphics = circuitJson.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id === component.schematic_component_id,
  )
  expect(
    circuitJson.every(
      (element) => any_circuit_element.safeParse(element).success,
    ),
  ).toBe(true)
  return { component, graphics }
}

const circle =
  "|RECORD=8|Location.X=50|Location.Y=50|Radius=5|SecondaryRadius=5|Color=16711680|AreaColor=12632256|IsSolid=T"

test("preserves a single native ellipse as a circular component body", () => {
  const { component, graphics } = convertBody([circle])
  expect(component.is_box_with_pins).toBe(false)
  const converted = graphics.find(
    (element) => element.type === "schematic_circle",
  )
  if (converted?.type !== "schematic_circle") throw new Error("Missing circle")
  expect(converted.center).toEqual({ x: 5, y: 5 })
  expect(converted.radius).toBeCloseTo(0.5, 8)
  expect(converted.is_filled).toBe(true)
})

test("preserves a non-circular ellipse as a closed component path", () => {
  const { component, graphics } = convertBody([
    circle.replace("SecondaryRadius=5", "SecondaryRadius=3"),
  ])
  expect(component.is_box_with_pins).toBe(false)
  const path = graphics.find((element) => element.type === "schematic_path")
  if (path?.type !== "schematic_path") throw new Error("Missing ellipse path")
  expect(path.points).toHaveLength(49)
  expect(Math.max(...path.points.map((point) => point.x))).toBeCloseTo(5.5, 8)
  expect(Math.max(...path.points.map((point) => point.y))).toBeCloseTo(5.3, 8)
  expect(path.is_filled).toBe(true)
})

test("clamps oversized rounded-rectangle corners to a circular body", () => {
  const { component, graphics } = convertBody([
    "|RECORD=10|Location.X=55|Location.Y=55|Corner.X=45|Corner.Y=45|CornerXRadius=20|CornerYRadius=20|Color=16711680|AreaColor=12632256|IsSolid=T",
  ])
  expect(component.is_box_with_pins).toBe(false)
  const converted = graphics.find(
    (element) => element.type === "schematic_circle",
  )
  if (converted?.type !== "schematic_circle") throw new Error("Missing circle")
  expect(converted.center).toEqual({ x: 5, y: 5 })
  expect(converted.radius).toBeCloseTo(0.5, 8)
  expect(converted.color).toBe("#0000ff")
  expect(converted.fill_color).toBe("#c0c0c0")
})

test.each(["14", "10"])(
  "keeps a circle decorating a RECORD=%s IC as a box",
  (kind) => {
    const { component, graphics } = convertBody([
      circle,
      `|RECORD=${kind}|Location.X=20|Location.Y=20|Corner.X=80|Corner.Y=80|CornerXRadius=2|CornerYRadius=2`,
    ])
    expect(component.is_box_with_pins).toBe(true)
    expect(
      graphics.filter((element) => element.type === "schematic_circle"),
    ).toHaveLength(0)
  },
)

test("does not infer a circular body from a lone line", () => {
  const { component } = convertBody([
    "|RECORD=13|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55",
  ])
  expect(component.is_box_with_pins).toBe(true)
})

test.each([
  "CornerXRadius=2|CornerYRadius=2",
  "CornerXRadius=5|CornerYRadius=2",
  "CornerXRadius=0|CornerYRadius=0",
])("does not infer a circle from incomplete rounding (%s)", (radii) => {
  const { component, graphics } = convertBody([
    `|RECORD=10|Location.X=45|Location.Y=45|Corner.X=55|Corner.Y=55|${radii}`,
  ])
  expect(component.is_box_with_pins).toBe(true)
  expect(
    graphics.filter((element) => element.type === "schematic_circle"),
  ).toHaveLength(0)
})
