import { expect, test } from "bun:test"
import { TI_POWER_REFERENCE_PCB_FILENAMES } from "../../scripts/references/reference-manifest"
import { getImportedPcbBoard } from "../helpers/get-imported-pcb-board"

test("imports board thickness from a modern Altium layer stack", async () => {
  const board = await getImportedPcbBoard({
    filename: TI_POWER_REFERENCE_PCB_FILENAMES.pmp22650,
  })

  expect(board.thickness).toBeCloseTo(2.25044, 5)
})

test("defaults to 1.6 mm when thickness data is unavailable", async () => {
  const board = await getImportedPcbBoard({
    filename: "simplefocmini-2024-04-26.PcbDoc",
  })

  expect(board.thickness).toBe(1.6)
})
