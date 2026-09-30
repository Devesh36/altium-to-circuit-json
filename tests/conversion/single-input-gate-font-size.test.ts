import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test.each([
  {
    title: "custom name font",
    fields:
      "|FONTID=1|PINNAME_POSITIONCONGLOMERATE=16|NAME_CUSTOMFONTID=2|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
    nameSize: 18,
    designatorSize: 6,
  },
  {
    title: "system name font",
    fields:
      "|FONTID=2|PINNAME_POSITIONCONGLOMERATE=0|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
    nameSize: 6,
    designatorSize: 18,
  },
  {
    title: "legacy shared font",
    fields: "|FONTID=2",
    nameSize: 18,
    designatorSize: 18,
  },
])(
  "preserves a triangular gate's $title",
  ({ fields, nameSize, designatorSize }) => {
    const document = parseAltiumSchDoc(
      [
        "|RECORD=31|CUSTOMX=200|CUSTOMY=200|SYSTEMFONT=1|SIZE1=6|SIZE2=18",
        "|RECORD=1|LIBREFERENCE=SingleInputGate|CURRENTPARTID=1",
        "|RECORD=13|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=100|LOCATION.Y=80|CORNER.X=100|CORNER.Y=120",
        "|RECORD=13|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=100|LOCATION.Y=120|CORNER.X=140|CORNER.Y=100",
        "|RECORD=13|OWNERINDEX=1|OWNERPARTID=1|LOCATION.X=140|LOCATION.Y=100|CORNER.X=100|CORNER.Y=80",
        "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|PINCONGLOMERATE=26|PINLENGTH=10|LOCATION.X=100|LOCATION.Y=110|NAME=A|DESIGNATOR=1",
        "|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|PINCONGLOMERATE=24|PINLENGTH=10|LOCATION.X=140|LOCATION.Y=100|NAME=Y|DESIGNATOR=2",
        `|RECORD=2|OWNERINDEX=1|OWNERPARTID=1|PINCONGLOMERATE=26|PINLENGTH=10|LOCATION.X=100|LOCATION.Y=90|NAME=O\\E\\|DESIGNATOR=3${fields}`,
      ].join("\n"),
    )
    for (const scale of [1, 0.01]) {
      const circuitJson = convertAltiumSchDocToCircuitJson(document, {
        centerOnSchematicSheet: false,
        schematicUnitScale: scale,
      })
      expect(
        circuitJson.find((element) => element.type === "schematic_component"),
      ).toMatchObject({ is_box_with_pins: false })
      const labels = circuitJson.filter(
        (element) => element.type === "schematic_text",
      )
      const nameLabels = labels.filter(
        (element) =>
          element.schematic_text_id === "schematic_pin_name_altium_7",
      )
      expect(nameLabels).toHaveLength(1)
      expect(nameLabels[0]?.font_size).toBeCloseTo(nameSize * scale, 6)
      expect(nameLabels[0]).toMatchObject({
        text: "OE",
        text_parts: [{ text: "OE", is_overlined: true }],
      })
      expect(
        labels.find(
          (element) =>
            element.schematic_text_id === "schematic_pin_designator_altium_7",
        )?.font_size,
      ).toBeCloseTo(designatorSize * scale, 6)
      const port = circuitJson.find(
        (element) =>
          element.type === "schematic_port" && element.pin_number === 3,
      )
      expect(port).not.toHaveProperty("display_pin_label")
      expect(port).not.toHaveProperty("display_pin_label_text_parts")
    }
  },
)
