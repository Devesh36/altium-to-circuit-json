import type { SchematicArc, SchematicPath } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

const MAXIMUM_ARC_STEP_DEGREES = 7.5

export function convertSchematicArcToPath(
  schematicArc: SchematicArc,
): SchematicPath {
  const rawSpanDegrees =
    schematicArc.end_angle_degrees - schematicArc.start_angle_degrees
  const normalizedCounterclockwiseSpan = ((rawSpanDegrees % 360) + 360) % 360
  const counterclockwiseSpanDegrees =
    normalizedCounterclockwiseSpan === 0 && rawSpanDegrees !== 0
      ? 360
      : normalizedCounterclockwiseSpan
  const signedSpanDegrees =
    schematicArc.direction === "clockwise"
      ? counterclockwiseSpanDegrees - 360
      : counterclockwiseSpanDegrees
  const segmentCount = Math.max(
    Math.ceil(Math.abs(signedSpanDegrees) / MAXIMUM_ARC_STEP_DEGREES),
    1,
  )
  const points = Array.from({ length: segmentCount + 1 }, (_, index) => {
    const ccwRotationDegrees =
      schematicArc.start_angle_degrees +
      (signedSpanDegrees * index) / segmentCount
    const arcToSchematic = compose(
      translate(schematicArc.center.x, schematicArc.center.y),
      rotateDEG(ccwRotationDegrees),
    )
    return applyToPoint(arcToSchematic, { x: schematicArc.radius, y: 0 })
  })

  return {
    type: "schematic_path",
    schematic_path_id: schematicArc.schematic_arc_id.replace(
      "schematic_arc_",
      "schematic_path_",
    ),
    schematic_sheet_id: schematicArc.schematic_sheet_id,
    schematic_component_id: schematicArc.schematic_component_id,
    is_dashed: schematicArc.is_dashed,
    is_filled: false,
    points,
    stroke_color: schematicArc.color,
    stroke_width: schematicArc.stroke_width,
  }
}
