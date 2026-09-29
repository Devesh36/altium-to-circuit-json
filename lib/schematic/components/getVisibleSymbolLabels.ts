import { type AltiumRecord, AltiumSchLabelRecord } from "altiumts"

export function getVisibleSymbolLabels(records: AltiumRecord[]): Set<string> {
  return new Set(
    records
      .filter(
        (record): record is AltiumSchLabelRecord =>
          record instanceof AltiumSchLabelRecord,
      )
      .flatMap((record) => {
        const text = record.text?.trim().toUpperCase()
        return text ? [text] : []
      }),
  )
}
