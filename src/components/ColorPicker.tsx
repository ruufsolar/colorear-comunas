import { palette } from '../data/palette'

type ColorPickerProps = {
  selectedCommuneName?: string
  selectedColorId?: string
  onSelectColor: (colorId: string) => void
  onClearColor: () => void
}

const ColorPicker = ({
  selectedCommuneName,
  selectedColorId,
  onSelectColor,
  onClearColor,
}: ColorPickerProps) => {
  return (
    <div className="color-picker">
      <div className="color-picker__header">
        <h3>Selección</h3>
        <p>{selectedCommuneName ?? 'Haz clic en una comuna'}</p>
      </div>
      <div className="color-picker__grid">
        {palette.map((color) => {
          const isSelected = selectedColorId === color.id
          return (
            <button
              key={color.id}
              type="button"
              className={`color-picker__swatch${isSelected ? ' is-active' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => onSelectColor(color.id)}
              aria-label={`Asignar ${color.defaultLabel}`}
            >
              {isSelected && <span className="swatch-check">{String.fromCharCode(10003)}</span>}
            </button>
          )
        })}
      </div>
      <button className="link-button" type="button" onClick={onClearColor} disabled={!selectedColorId}>
        Quitar color
      </button>
    </div>
  )
}

export default ColorPicker

