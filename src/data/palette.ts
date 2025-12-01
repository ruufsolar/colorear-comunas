export type PaletteColor = {
  id: string
  hex: string
  defaultLabel: string
}

export const palette: PaletteColor[] = [
  { id: 'color-1', hex: '#f94144', defaultLabel: 'Prioridad 1' },
  { id: 'color-2', hex: '#f3722c', defaultLabel: 'Prioridad 2' },
  { id: 'color-3', hex: '#f9c74f', defaultLabel: 'Prioridad 3' },
  { id: 'color-4', hex: '#90be6d', defaultLabel: 'Prioridad 4' },
  { id: 'color-5', hex: '#43aa8b', defaultLabel: 'Prioridad 5' },
  { id: 'color-6', hex: '#577590', defaultLabel: 'Prioridad 6' },
  { id: 'color-7', hex: '#4d908e', defaultLabel: 'Prioridad 7' },
  { id: 'color-8', hex: '#277da1', defaultLabel: 'Prioridad 8' },
  { id: 'color-9', hex: '#b5179e', defaultLabel: 'Prioridad 9' },
  { id: 'color-10', hex: '#7209b7', defaultLabel: 'Prioridad 10' },
]

export const DEFAULT_GRAY = '#c5c6cb'

export const paletteById = palette.reduce<Record<string, PaletteColor>>((acc, color) => {
  acc[color.id] = color
  return acc
}, {})

