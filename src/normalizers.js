function toText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${key}: ${toText(nested)}`)
      .join('; ')
  }
  return String(value)
}

export function normalizeTestDesign(raw, hypothesisId) {
  const design = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const duration = Number.parseInt(design.suggestedDurationDays, 10)

  return {
    hypothesisId: toText(design.hypothesisId) || hypothesisId,
    experimentName: toText(design.experimentName),
    variantControl: toText(design.variantControl),
    variantTreatment: toText(design.variantTreatment),
    targetSegment: toText(design.targetSegment),
    primaryMetric: toText(design.primaryMetric),
    secondaryMetrics: Array.isArray(design.secondaryMetrics)
      ? design.secondaryMetrics.map(toText).filter(Boolean)
      : design.secondaryMetrics ? [toText(design.secondaryMetrics)] : [],
    successCriterion: toText(design.successCriterion),
    suggestedDurationDays: Number.isFinite(duration) ? duration : null,
    minSampleNote: toText(design.minSampleNote)
  }
}
