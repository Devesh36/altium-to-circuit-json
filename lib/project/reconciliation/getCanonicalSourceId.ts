export const getCanonicalSourceId = ({
  id,
  idReplacements,
}: {
  id: string
  idReplacements: Map<string, string>
}): string => idReplacements.get(id) ?? id
