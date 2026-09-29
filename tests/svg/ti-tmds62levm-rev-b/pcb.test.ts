import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { any_circuit_element } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertAltiumPcbDocToCircuitJson } from "../../../lib"
import { TI_TMDS62LEVM_PCB_FILENAME } from "../../../scripts/references/reference-manifest"
import { getPcbBoardViewport } from "../../helpers/filter-pcb-layer"
import { readReferenceBytes } from "../../helpers/read-reference"
import { stackAltiumAndCircuitJsonSvgs } from "../../helpers/stack-svg-comparison"

test(
  "TI TMDS62LEVM Rev. B full PCB top view",
  async () => {
    const source = await readReferenceBytes(TI_TMDS62LEVM_PCB_FILENAME)
    const document = parseAltiumBinaryPcbDoc(source)
    const circuitJson = convertAltiumPcbDocToCircuitJson(document)

    expect(
      circuitJson.filter((element) => element.type === "pcb_board"),
    ).toHaveLength(1)
    expect(
      circuitJson.filter((element) => element.type === "pcb_component").length,
    ).toBeGreaterThan(1_000)
    expect(
      circuitJson.filter((element) => element.type === "pcb_trace").length,
    ).toBeGreaterThan(20_000)
    expect(
      circuitJson.filter((element) => element.type === "pcb_smtpad").length,
    ).toBeGreaterThan(5_000)
    expect(
      circuitJson.filter(
        (element) =>
          element.type === "pcb_keepout" && element.shape === "outline",
      ),
    ).toHaveLength(14)
    const representativeElements = [
      ...new Map(
        circuitJson.map((element) => [element.type, element]),
      ).values(),
    ]
    expect(
      representativeElements.every(
        (element) => any_circuit_element.safeParse(element).success,
      ),
    ).toBe(true)

    const boardViewport = getPcbBoardViewport(circuitJson)
    expect(boardViewport.maxX - boardViewport.minX).toBeGreaterThan(130)
    expect(boardViewport.maxY - boardViewport.minY).toBeGreaterThan(140)
    const boardBounds = document.boardGeometry.outline.bounds
    if (!boardBounds) throw new Error("TI TMDS62LEVM PCB has no board outline")
    const boardPadding =
      Math.max(
        boardBounds.maxX - boardBounds.minX,
        boardBounds.maxY - boardBounds.minY,
      ) * 0.05
    const title = "TI TMDS62LEVM Rev. B full PCB top view"
    const altiumSvg = serializeAltiumPcbToSvg(document, {
      height: 800,
      layers: ["TOP", "TOPOVERLAY", "TOPSOLDER", "TOPPASTE", "MULTILAYER"],
      title: `${title} — altiumts source`,
      viewBox: {
        height: boardBounds.maxY - boardBounds.minY + 2 * boardPadding,
        width: boardBounds.maxX - boardBounds.minX + 2 * boardPadding,
        x: boardBounds.minX - boardPadding,
        y: boardBounds.minY - boardPadding,
      },
      width: 800,
    })
    const circuitJsonSvg = convertCircuitJsonToPcbSvg(circuitJson, {
      height: 800,
      layer: "top",
      matchBoardAspectRatio: true,
      viewport: boardViewport,
      width: 800,
    })
    const comparisonSvg = stackAltiumAndCircuitJsonSvgs({
      altiumSvg,
      circuitJsonSvg,
      label: title,
    })

    await expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
  },
  { timeout: 600_000 },
)
