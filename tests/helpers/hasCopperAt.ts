import type { PcbCopperPour, Point } from "circuit-json"

export function hasCopperAt(pours: PcbCopperPour[], point: Point): boolean {
  return pours.some((pour) => {
    const rings =
      pour.shape === "polygon"
        ? [pour.points]
        : pour.shape === "brep"
          ? [
              pour.brep_shape.outer_ring.vertices,
              ...pour.brep_shape.inner_rings.map((ring) => ring.vertices),
            ]
          : []
    let inside = false
    for (const ring of rings) {
      for (let index = 0; index < ring.length; index++) {
        const start = ring[index]
        const end = ring[(index + 1) % ring.length]
        if (!start || !end) continue
        if (
          start.y > point.y !== end.y > point.y &&
          point.x <
            start.x +
              ((point.y - start.y) * (end.x - start.x)) / (end.y - start.y)
        )
          inside = !inside
      }
    }
    return inside
  })
}
