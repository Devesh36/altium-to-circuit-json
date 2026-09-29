import {
  AltiumArcRecord,
  AltiumDimensionRecord,
  AltiumFillRecord,
  AltiumPadRecord,
  AltiumRegionRecord,
  AltiumTextRecord,
  AltiumTrackRecord,
  AltiumViaRecord,
} from "altiumts"
import {
  convertPcbArcKeepout,
  convertPcbDimension,
  convertPcbFabricationNotePath,
  isExplodedPcbDimensionGraphic,
} from "../annotations"
import {
  getRecordLayer,
  isCourtyardLayer,
  isKeepoutLayer,
  isMechanicalLayer,
  isOverlayLayer,
} from "../layers"
import type { PcbConversionContext } from "../model"
import { convertPcbArcTrack, convertPcbTrack, convertPcbVia } from "../routing"
import {
  convertPcbSilkscreenArc,
  convertPcbSilkscreenFill,
  convertPcbSilkscreenLine,
  convertPcbSilkscreenRegion,
  convertPcbSilkscreenText,
  isHiddenPcbComponentText,
} from "../silkscreen"
import { convertPcbCopperText, convertPcbMechanicalText } from "../text"
import { convertPcbPadRecord } from "./convertPcbPadRecord"

export function convertPcbRecords(context: PcbConversionContext): void {
  const { document, elements, layerMap, netContext, options } = context
  const routing = { layerMap, netContext }
  for (const [recordIndex, record] of document.records.entries()) {
    const isKeepoutArc =
      record instanceof AltiumArcRecord &&
      (isKeepoutLayer(record.layer) || record.getBoolean("KEEPOUT") === true)
    if (isKeepoutArc) {
      if (options.includeKeepouts !== false) {
        const keepout = convertPcbArcKeepout({
          layerMap,
          record,
          recordIndex,
        })
        if (keepout) elements.push(keepout)
      }
      continue
    }

    if (record instanceof AltiumDimensionRecord) {
      if (options.includeDimensions === false) continue
      const dimension = convertPcbDimension({ record, recordIndex })
      if (dimension) elements.push(dimension)
      continue
    }

    if (
      options.includeDimensions !== false &&
      isExplodedPcbDimensionGraphic(document, record)
    ) {
      const path = convertPcbFabricationNotePath({ record, recordIndex })
      if (path) elements.push(path)
      continue
    }

    if (record instanceof AltiumPadRecord && options.includePads !== false) {
      convertPcbPadRecord({ context, record, recordIndex })
      continue
    }

    if (record instanceof AltiumTrackRecord) {
      if (isCourtyardLayer(record.layer)) continue
      if (isOverlayLayer(record.layer)) {
        if (options.includeSilkscreen === false) continue
        const line = convertPcbSilkscreenLine({ record, recordIndex })
        if (line) elements.push(line)
      } else if (options.includeTraces !== false) {
        const trace = convertPcbTrack({
          ...routing,
          record,
          recordIndex,
        })
        if (trace) elements.push(trace)
      }
      continue
    }

    if (record instanceof AltiumViaRecord && options.includeVias !== false) {
      const via = convertPcbVia({ ...routing, record, recordIndex })
      if (via) elements.push(via)
      continue
    }

    if (record instanceof AltiumArcRecord) {
      if (isCourtyardLayer(record.layer)) continue
      if (isOverlayLayer(record.layer)) {
        if (options.includeSilkscreen === false) continue
        const path = convertPcbSilkscreenArc({ record, recordIndex })
        if (path) elements.push(path)
      } else if (options.includeTraces !== false) {
        const trace = convertPcbArcTrack({
          ...routing,
          record,
          recordIndex,
        })
        if (trace) elements.push(trace)
      }
      continue
    }

    if (record instanceof AltiumTextRecord) {
      if (isCourtyardLayer(record.layer)) continue
      if (isMechanicalLayer(record.layer)) {
        const text = convertPcbMechanicalText({
          document,
          record,
          recordIndex,
        })
        if (text) elements.push(text)
        continue
      }
      if (isOverlayLayer(record.layer)) {
        if (options.includeSilkscreen === false) continue
        if (isHiddenPcbComponentText({ document, record })) continue
        const text = convertPcbSilkscreenText({ document, record, recordIndex })
        if (text) elements.push(text)
      } else {
        const text = convertPcbCopperText({ layerMap, record, recordIndex })
        if (text) elements.push(text)
      }
      continue
    }

    if (record instanceof AltiumRegionRecord && isOverlayLayer(record.layer)) {
      if (options.includeSilkscreen === false) continue
      const graphic = convertPcbSilkscreenRegion({ record, recordIndex })
      if (graphic) elements.push(graphic)
      continue
    }

    if (
      options.includeSilkscreen === false ||
      !isOverlayLayer(getRecordLayer(record))
    ) {
      continue
    }

    if (record instanceof AltiumFillRecord) {
      const rect = convertPcbSilkscreenFill({ record, recordIndex })
      if (rect) elements.push(rect)
    }
  }
}
