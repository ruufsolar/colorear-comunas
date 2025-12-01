import { useRef, type ChangeEvent } from 'react';
import type { PaletteColor } from '../data/palette';
import type { CommuneFeature } from '../types/geo';
import type { ColorAssignments, LegendLabels } from '../utils/storage';
import ColorPicker from './ColorPicker';

type LegendPanelProps = {
  palette: PaletteColor[];
  labels: LegendLabels;
  assignments: ColorAssignments;
  selectedCommune?: CommuneFeature;
  onLabelChange: (colorId: string, label: string) => void;
  colorGroups: Record<string, CommuneFeature[]>;
  onSelectColor: (colorId: string) => void;
  onClearColor: () => void;
  onDownloadCsv: () => void;
  onUploadCsv: (file: File) => void;
  onClearAll: () => void;
};

const formatList = (items: CommuneFeature[]) => {
  if (!items.length) return 'Sin comunas asignadas';
  const preview = items.slice(0, 3).map((item) => item.properties.comuna);
  const extra = items.length - preview.length;
  return `${preview.join(', ')}${extra > 0 ? ` +${extra}` : ''}`;
};

const LegendPanel = ({
  palette,
  labels,
  selectedCommune,
  assignments,
  colorGroups,
  onLabelChange,
  onSelectColor,
  onClearColor,
  onDownloadCsv,
  onUploadCsv,
  onClearAll,
}: LegendPanelProps) => {
  const selectedColorId = selectedCommune
    ? assignments[String(selectedCommune.properties.cut)]
    : undefined;
  const hasAssignments = Object.values(assignments).some(Boolean);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadCsv(file);
    }
    event.target.value = '';
  };

  return (
    <aside className='legend-panel'>
      <input
        ref={fileInputRef}
        type='file'
        accept='.csv,text/csv'
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className='legend-section'>
        <ColorPicker
          selectedCommuneName={selectedCommune?.properties.comuna}
          selectedColorId={selectedColorId}
          onSelectColor={onSelectColor}
          onClearColor={onClearColor}
        />
        <dl className='commune-details'>
          <div>
            <dt>Región</dt>
            <dd>{selectedCommune?.properties.region_1 ?? 'N/A'}</dd>
          </div>
          <div>
            <dt>ID región</dt>
            <dd>{selectedCommune?.properties.region ?? 'N/A'}</dd>
          </div>
          <div>
            <dt>Código CUT</dt>
            <dd>{selectedCommune?.properties.cut ?? 'N/A'}</dd>
          </div>
        </dl>
      </div>

      <div className='legend-section legend-section--scroll'>
        <div className='legend-actions'>
          <h3>Grupos de color</h3>
          <div className='legend-action-buttons'>
            <button
              type='button'
              onClick={onDownloadCsv}
              className='primary-button'
              disabled={!hasAssignments}
            >
              Descargar CSV
            </button>
            <button
              type='button'
              className='secondary-button'
              onClick={() => fileInputRef.current?.click()}
            >
              Cargar CSV
            </button>
            <button type='button' className='secondary-button' onClick={onClearAll}>
              Limpiar colores
            </button>
          </div>
        </div>
        <div className='legend-list'>
          {palette.map((color) => {
            const assignedFeatures = colorGroups[color.id] ?? [];
            const inputValue = labels[color.id] ?? color.defaultLabel;
            return (
              <div key={color.id} className='legend-row'>
                <span className='legend-swatch' style={{ backgroundColor: color.hex }} />
                <div className='legend-row__body'>
                  <input
                    type='text'
                    value={inputValue}
                    onChange={(event) => onLabelChange(color.id, event.target.value)}
                  />
                  <p className='legend-row__meta'>
                    <span>{assignedFeatures.length} comunas</span>
                    <span>{formatList(assignedFeatures)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default LegendPanel;
