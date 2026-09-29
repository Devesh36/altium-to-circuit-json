import { expect, test } from "bun:test"
import { parseAltiumSchDoc } from "altiumts"
import type { SchematicPort } from "circuit-json"
import { convertAltiumSchDocToCircuitJson } from "../../lib"

test.each([
  {
    expectedSize: 0.06,
    pinFontFields:
      "|FONTID=2|PINNAME_POSITIONCONGLOMERATE=0|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
    sheetFontFields: "|SYSTEMFONT=1|SIZE1=6|SIZE2=18",
    title: "modern system font",
  },
  {
    expectedSize: 0.18,
    pinFontFields:
      "|PINNAME_POSITIONCONGLOMERATE=16|NAME_CUSTOMFONTID=2|PINDESIGNATOR_POSITIONCONGLOMERATE=0",
    sheetFontFields: "|SYSTEMFONT=1|SIZE1=6|SIZE2=18",
    title: "modern custom name font",
  },
  {
    expectedSize: 0.18,
    pinFontFields: "|FONTID=2",
    sheetFontFields: "|SYSTEMFONT=1|SIZE1=6|SIZE2=18",
    title: "legacy shared font",
  },
])(
  "preserves $title sizing",
  ({ expectedSize, pinFontFields, sheetFontFields }) => {
    const source = [
      `|RECORD=31|CUSTOMX=100|CUSTOMY=100${sheetFontFields}`,
      "|RECORD=1|LibReference=IC|Designator=U1|PartCount=1|DisplayModeCount=1|IndexInSheet=1|OwnerPartId=-1|Location.X=50|Location.Y=50|CurrentPartId=1|AllPinCount=1",
      `|RECORD=2|OwnerIndex=1|OwnerPartId=1|Location.X=40|Location.Y=50|Name=INPUT|Designator=1|PinLength=10|PinConglomerate=58${pinFontFields}`,
    ].join("\n")
    const circuitJson = convertAltiumSchDocToCircuitJson(
      parseAltiumSchDoc(source),
      { centerOnSchematicSheet: false, schematicUnitScale: 0.01 },
    )
    const pin = circuitJson.find(
      (element): element is SchematicPort =>
        element.type === "schematic_port" &&
        element.display_pin_label === "INPUT",
    )

    expect(pin?.display_pin_label_font_size).toBeCloseTo(expectedSize, 6)
  },
)
