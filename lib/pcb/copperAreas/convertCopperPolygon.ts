import {
  type AltiumPolygonRecord,
  type AltiumRegionRecord,
  getPcbContour,
  getPcbRegionGeometry,
} from "altiumts"
import type { PcbCopperPour } from "circuit-json"
import polygonClipping, { type Pair, type Polygon } from "polygon-clipping"
import type { PcbCopperLayerMap } from "../layers"
import { contourToPoints } from "./contourToPoints"

export function convertCopperPolygon({
  cutouts,
  polygonIndex,
  layerMap,
  record,
  sourceNetId,
}: {
  cutouts: AltiumRegionRecord[]
  polygonIndex: number
  layerMap: PcbCopperLayerMap
  record: AltiumPolygonRecord
  sourceNetId: string | undefined
}): PcbCopperPour[] {
  const layer = layerMap.getLayer(record.layer)
  if (!layer) return []
  const points = contourToPoints(getPcbContour(record))
  if (points.length < 3) return []
  const cutoutPolygons = cutouts.map((cutout): Polygon => {
    const geometry = getPcbRegionGeometry(cutout)
    return [geometry.outline, ...geometry.holes].map((contour) =>
      contourToPoints(contour).map((point): Pair => [point.x, point.y]),
    )
  })
  const copperPolygons =
    cutouts.length === 0
      ? [[points]]
      : polygonClipping
          .difference(
            [points.map((point): Pair => [point.x, point.y])],
            cutoutPolygons,
          )
          .map((polygon) =>
            polygon.map((ring) =>
              ring.slice(0, -1).map(([x, y]) => ({ x, y })),
            ),
          )

  return copperPolygons.flatMap(
    ([outerRing, ...holes], partIndex): PcbCopperPour[] => {
      if (!outerRing || outerRing.length < 3) return []
      return [
        {
          type: "pcb_copper_pour",
          pcb_copper_pour_id: `pcb_copper_pour_altium_polygon_${polygonIndex}${partIndex === 0 ? "" : `_island_${partIndex}`}`,
          ...(sourceNetId ? { source_net_id: sourceNetId } : {}),
          covered_with_solder_mask: true,
          layer,
          ...(holes.length === 0
            ? { shape: "polygon" as const, points: outerRing }
            : {
                shape: "brep" as const,
                brep_shape: {
                  outer_ring: { vertices: outerRing },
                  inner_rings: holes.map((vertices) => ({ vertices })),
                },
              }),
        },
      ]
    },
  )
}
