import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test.each([true, false])(
  "normalizes component artwork without recoloring sheet graphics, includeText=%s",
  (includeText) => {
    const document = parseAltiumSchDoc(
      [
        "|RECORD=31",
        "|RECORD=1|LibReference=CustomChip|Designator=U1|CurrentPartId=1|Location.X=50|Location.Y=50",
        "|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=30|Location.Y=50|Name=IN|Designator=1|PinLength=10|Orientation=0|COLOR=16711680",
        "|RECORD=13|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=40|Corner.X=60|Corner.Y=40|COLOR=16711680",
        "|RECORD=14|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=40|Corner.X=60|Corner.Y=60|COLOR=16714496|AREACOLOR=11599871|ISSOLID=T",
        "|RECORD=8|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|RADIUS=3|COLOR=16714496|AREACOLOR=16711680|ISSOLID=T",
        "|RECORD=8|OwnerIndex=1|OwnerPartId=1|Location.X=55|Location.Y=55|RADIUS=3|SECONDARYRADIUS=2|COLOR=16711680|AREACOLOR=16777215|ISSOLID=T",
        "|RECORD=12|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=50|RADIUS=5|STARTANGLE=0|ENDANGLE=180|COLOR=16711680",
        "|RECORD=6|OwnerIndex=1|OwnerPartId=1|LocationCount=2|X1=40|Y1=40|X2=60|Y2=60|COLOR=16711680",
        "|RECORD=7|OwnerIndex=1|OwnerPartId=1|LocationCount=3|X1=40|Y1=40|X2=50|Y2=60|X3=60|Y3=40|COLOR=16711680|AREACOLOR=16711680|ISSOLID=T",
        "|RECORD=34|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=35|Text=U1|COLOR=16711680",
        "|RECORD=41|OwnerIndex=1|OwnerPartId=1|Location.X=50|Location.Y=30|Name=Comment|Text=Custom|COLOR=16711680",
        "|RECORD=13|Location.X=80|Location.Y=40|Corner.X=90|Corner.Y=60|COLOR=16711680",
        "|RECORD=4|Location.X=80|Location.Y=30|Text=Sheet note|COLOR=16711680",
      ].join("\n"),
    )
    const elements = convertAltiumSchDocToCircuitJson(document, {
      schematicUnitScale: 1,
      centerOnSchematicSheet: false,
      includeText,
    })
    const owned = elements.filter(
      (element) =>
        "schematic_component_id" in element && element.schematic_component_id,
    )
    const graphics = owned.filter(
      (element) => "color" in element && element.type !== "schematic_text",
    )
    expect(graphics.length).toBeGreaterThan(2)
    for (const graphic of graphics) {
      expect(graphic).toHaveProperty("color", "#840000")
    }
    const paths = owned.filter((element) => element.type === "schematic_path")
    expect(paths).toHaveLength(4)
    expect(paths.every((path) => path.stroke_color === "#840000")).toBe(true)
    expect(paths.find((path) => path.points.length === 3)).toMatchObject({
      fill_color: "#840000",
      is_filled: true,
    })
    expect(
      owned.find((element) => element.type === "schematic_rect"),
    ).toMatchObject({
      fill_color: "#ffffb0",
      is_filled: true,
    })
    expect(
      owned.find((element) => element.type === "schematic_circle"),
    ).toMatchObject({
      fill_color: "#840000",
      is_filled: true,
    })
    expect(
      paths.some((path) => path.is_filled && path.fill_color === "#ffffff"),
    ).toBe(true)
    const labels = owned
      .filter((element) => element.type === "schematic_text")
      .filter((element) => ["U1", "Custom"].includes(element.text))
    expect(labels).toHaveLength(includeText ? 2 : 0)
    expect(labels.every((label) => label.color === "#000000")).toBe(true)
    expect(
      elements.find(
        (element) =>
          element.type === "schematic_line" &&
          !("schematic_component_id" in element),
      ),
    ).toMatchObject({ color: "#0000ff" })
    if (includeText) {
      expect(
        elements.find(
          (element) =>
            element.type === "schematic_text" && element.text === "Sheet note",
        ),
      ).toMatchObject({ color: "#0000ff" })
    }
  },
)

test.each([
  ["ti-lm5155evm-fly.SchDoc", "U3"],
  ["ti-tmds62levm-rev-b/23.SchDoc", "SW4"],
  ["ti-tmds62levm-rev-b/23.SchDoc", "R173"],
  ["ti-tmds62levm-rev-b/56.SchDoc", "U94"],
])("%s %s uses standard symbol ink", async (filename, name) => {
  const document = parseAltiumSchDoc(await readReferenceBytes(filename))
  const elements = convertAltiumSchDocToCircuitJson(document)
  const noErcIds = new Set(
    document.records.flatMap((record, index) =>
      record.recordKind === "22"
        ? [
            `schematic_line_altium_${index}_a`,
            `schematic_line_altium_${index}_b`,
          ]
        : [],
    ),
  )
  const source = elements.find(
    (element) => element.type === "source_component" && element.name === name,
  )
  if (source?.type !== "source_component") throw new Error(`Missing ${name}`)
  const component = elements.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === source.source_component_id,
  )
  if (component?.type !== "schematic_component")
    throw new Error(`Missing ${name}`)
  const owned = elements.filter(
    (element) =>
      "schematic_component_id" in element &&
      element.schematic_component_id === component.schematic_component_id,
  )
  const graphics = owned.filter(
    (element) =>
      element.type === "schematic_line" ||
      element.type === "schematic_circle" ||
      element.type === "schematic_rect" ||
      element.type === "schematic_path",
  )
  expect(graphics.length).toBeGreaterThan(0)
  for (const graphic of graphics) {
    if (
      graphic.type === "schematic_line" &&
      noErcIds.has(graphic.schematic_line_id)
    ) {
      expect(graphic.color).toBe("#ff0000")
      continue
    }
    expect(
      graphic.type === "schematic_path" ? graphic.stroke_color : graphic.color,
    ).toBe("#840000")
    if ("fill_color" in graphic) {
      expect(graphic.fill_color).not.toBe("#0000ff")
    }
  }
  const labels = owned
    .filter((element) => element.type === "schematic_text")
    .filter((element) => element.text === name)
  expect(labels).toHaveLength(1)
  expect(labels[0]?.color).toBe("#000000")
})
