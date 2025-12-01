export type ColorAssignments = Record<string, string | undefined>
export type LegendLabels = Record<string, string>

const ASSIGNMENTS_KEY = 'chile-map-assignments'
const LABELS_KEY = 'chile-map-labels'

const hasWindow = () => typeof window !== 'undefined'

export const loadAssignments = (): ColorAssignments => {
  if (!hasWindow()) return {}
  try {
    const raw = window.localStorage.getItem(ASSIGNMENTS_KEY)
    return raw ? (JSON.parse(raw) as ColorAssignments) : {}
  } catch (error) {
    console.warn('Failed to load assignments', error)
    return {}
  }
}

export const saveAssignments = (assignments: ColorAssignments) => {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
  } catch (error) {
    console.warn('Failed to persist assignments', error)
  }
}

export const loadLegendLabels = (): LegendLabels => {
  if (!hasWindow()) return {}
  try {
    const raw = window.localStorage.getItem(LABELS_KEY)
    return raw ? (JSON.parse(raw) as LegendLabels) : {}
  } catch (error) {
    console.warn('Failed to load legend labels', error)
    return {}
  }
}

export const saveLegendLabels = (labels: LegendLabels) => {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
  } catch (error) {
    console.warn('Failed to persist labels', error)
  }
}

export const clearAssignments = () => {
  if (!hasWindow()) return
  window.localStorage.removeItem(ASSIGNMENTS_KEY)
}

