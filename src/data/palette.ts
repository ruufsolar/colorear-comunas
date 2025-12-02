export type PaletteColor = {
  id: string
  hex: string
  defaultLabel: string
}

export const palette: PaletteColor[] = [
  { id: 'color-1', hex: '#e6194b', defaultLabel: 'Red' },
  { id: 'color-2', hex: '#f58231', defaultLabel: 'Orange' },
  { id: 'color-3', hex: '#ffe119', defaultLabel: 'Yellow' },
  { id: 'color-4', hex: '#bfef45', defaultLabel: 'Lime' },
  { id: 'color-5', hex: '#3cb44b', defaultLabel: 'Green' },
  { id: 'color-6', hex: '#42d4f4', defaultLabel: 'Cyan' },
  { id: 'color-7', hex: '#4363d8', defaultLabel: 'Blue' },
  { id: 'color-8', hex: '#911eb4', defaultLabel: 'Purple' },
  { id: 'color-9', hex: '#f032e6', defaultLabel: 'Magenta' },
  { id: 'color-10', hex: '#dcbeff', defaultLabel: 'Lavender' },
]

export const DEFAULT_GRAY = '#c5c6cb'

export const paletteById = palette.reduce<Record<string, PaletteColor>>((acc, color) => {
  acc[color.id] = color
  return acc
}, {})

