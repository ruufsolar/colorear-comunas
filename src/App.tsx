import { bbox, centroid } from '@turf/turf';
import type { Feature, GeoJsonObject } from 'geojson';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import './App.css';
import ChileMap from './components/ChileMap';
import LegendPanel from './components/LegendPanel';
import { palette } from './data/palette';
import type { CommuneFeature, CommuneFeatureCollection, CommuneLabel } from './types/geo';
import { buildCsv, downloadCsv, parseAssignmentsCsv } from './utils/csv';
import {
  loadAssignments,
  loadLegendLabels,
  saveAssignments,
  saveLegendLabels,
  type ColorAssignments,
  type LegendLabels,
} from './utils/storage';

type FeatureIndex = Record<string, CommuneFeature>;
type CommuneGeometryCollection = GeometryCollection<CommuneFeature['properties']>;
type CommuneTopology = Topology<{ Comunas_de_Chile: CommuneGeometryCollection }>;

const buildInitialLabels = (): LegendLabels => {
  const stored = loadLegendLabels();
  return palette.reduce<LegendLabels>((acc, color) => {
    acc[color.id] = stored[color.id] ?? color.defaultLabel;
    return acc;
  }, {});
};

function App() {
  const [geoData, setGeoData] = useState<CommuneFeatureCollection | null>(null);
  const [regionLayer, setRegionLayer] = useState<GeoJsonObject | null>(null);
  const [bounds, setBounds] = useState<LatLngBoundsExpression>();
  const [featureIndex, setFeatureIndex] = useState<FeatureIndex>({});
  const [assignments, setAssignments] = useState<ColorAssignments>(() => loadAssignments());
  const [legendLabels, setLegendLabels] = useState<LegendLabels>(() => buildInitialLabels());
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [labelPoints, setLabelPoints] = useState<CommuneLabel[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setStatus('loading');
      console.log('[Mapa] Inicio de carga de TopoJSON…');
      try {
        const response = await fetch('/data/Comunas_de_Chile.topojson');
        if (!response.ok) {
          throw new Error(`No se pudo cargar el TopoJSON (${response.status})`);
        }
        console.log('[Mapa] Respuesta recibida, convirtiendo a GeoJSON…');
        const topology = (await response.json()) as CommuneTopology;
        const communesObject = topology.objects.Comunas_de_Chile;
        const data = feature(topology, communesObject) as CommuneFeatureCollection;
        console.log('[Mapa] GeoJSON listo:', data.features.length, 'features');
        setGeoData(data);

        const featureMap: FeatureIndex = {};
        const labels: CommuneLabel[] = [];
        const processedLabels = new Set<string>();
        data.features.forEach((feature) => {
          const id = String(feature.properties.cut);
          featureMap[id] = feature;
          if (processedLabels.has(id)) {
            return;
          }
          if (!feature.geometry) {
            console.warn('[Mapa] Sin geometría para', feature.properties.comuna);
            return;
          }
          try {
            const center = centroid(feature as Feature);
            const coords = center.geometry?.coordinates;
            if (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords.every((value) => typeof value === 'number' && Number.isFinite(value))
            ) {
              const [lng, lat] = coords;
              labels.push({
                id,
                name: feature.properties.comuna,
                position: [lat, lng] as LatLngTuple,
              });
              processedLabels.add(id);
            }
          } catch (labelError) {
            console.warn(
              '[Mapa] No se pudo calcular centroide para',
              feature.properties.comuna,
              labelError
            );
          }
        });
        console.log('[Mapa] Índice de comunas construido');
        setFeatureIndex(featureMap);
        setLabelPoints(labels);

        const [minX, minY, maxX, maxY] = bbox(data);
        setBounds([
          [minY, minX],
          [maxY, maxX],
        ]);
        console.log('[Mapa] Límites calculados');

        const regionLines = mesh(topology, communesObject, (a, b) => {
          if (!a || !b) return false;
          const regionA = (a.properties as CommuneFeature['properties'] | undefined)?.region;
          const regionB = (b.properties as CommuneFeature['properties'] | undefined)?.region;
          return regionA !== regionB;
        });
        setRegionLayer(regionLines as GeoJsonObject);
        console.log('[Mapa] Fronteras regionales calculadas');
        setStatus('ready');
        console.log('[Mapa] Carga finalizada');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
        console.error('[Mapa] Error al cargar datos', error);
      }
    };

    fetchData();
  }, []);

  const groupedAssignments = useMemo(() => {
    const groups = palette.reduce<Record<string, CommuneFeature[]>>((acc, color) => {
      acc[color.id] = [];
      return acc;
    }, {});
    Object.entries(assignments).forEach(([cut, colorId]) => {
      if (!colorId) return;
      const feature = featureIndex[cut];
      if (feature) {
        groups[colorId] = [...(groups[colorId] ?? []), feature];
      }
    });
    return groups;
  }, [assignments, featureIndex]);

  const selectedCommune = selectedCommuneId ? featureIndex[selectedCommuneId] : undefined;

  const handleCommuneClick = useCallback((feature: CommuneFeature) => {
    setSelectedCommuneId(String(feature.properties.cut));
  }, []);

  const updateAssignments = useCallback((updater: (prev: ColorAssignments) => ColorAssignments) => {
    setAssignments((prev) => {
      const next = updater(prev);
      saveAssignments(next);
      return next;
    });
  }, []);

  const handleColorSelect = useCallback(
    (colorId: string) => {
      if (!selectedCommuneId) return;
      updateAssignments((prev) => ({
        ...prev,
        [selectedCommuneId]: colorId,
      }));
    },
    [selectedCommuneId, updateAssignments]
  );

  const handleClearColor = useCallback(() => {
    if (!selectedCommuneId) return;
    updateAssignments((prev) => {
      const next = { ...prev };
      delete next[selectedCommuneId];
      return next;
    });
  }, [selectedCommuneId, updateAssignments]);

  const handleClearAll = useCallback(() => {
    updateAssignments(() => ({}));
  }, [updateAssignments]);

  const handleLabelChange = useCallback((colorId: string, label: string) => {
    setLegendLabels((prev) => {
      const next = { ...prev, [colorId]: label };
      saveLegendLabels(next);
      return next;
    });
  }, []);

  const handleDownloadCsv = useCallback(() => {
    const csv = buildCsv(assignments, featureIndex, legendLabels);
    downloadCsv(csv, 'comunas_coloreadas.csv');
  }, [assignments, featureIndex, legendLabels]);

  const handleUploadCsv = useCallback(
    async (file: File) => {
      try {
        setStatus('loading');
        const text = await file.text();
        const { assignments: parsedAssignments, labels: parsedLabels } = parseAssignmentsCsv(text);
        updateAssignments(() => parsedAssignments);
        setLegendLabels(() => {
          saveLegendLabels(parsedLabels);
          return parsedLabels;
        });
        setStatus('ready');
        setErrorMessage(undefined);
      } catch (uploadError) {
        setStatus('ready');
        setErrorMessage(
          uploadError instanceof Error
            ? `No se pudo importar el CSV: ${uploadError.message}`
            : 'No se pudo importar el CSV.'
        );
        console.error('[Mapa] Error al importar CSV', uploadError);
      }
    },
    [updateAssignments]
  );

  return (
    <div className='app-shell'>
      <header className='app-header'>
        <div>
          <h1>Mapa de comunas de Chile</h1>
          <p>Selecciona comunas y asígnalas a un grupo de color.</p>
        </div>
        {status === 'loading' && <p className='status'>Cargando información…</p>}
        {status === 'error' && <p className='status status--error'>{errorMessage}</p>}
      </header>
      <main className='app-content'>
        <div className='map-column'>
          <ChileMap
            data={geoData ?? undefined}
            assignments={assignments}
            bounds={bounds}
            regionBoundaries={regionLayer}
            selectedCommuneId={selectedCommuneId}
            onCommuneClick={handleCommuneClick}
            labels={labelPoints}
          />
        </div>
        <LegendPanel
          palette={palette}
          labels={legendLabels}
          assignments={assignments}
          selectedCommune={selectedCommune}
          colorGroups={groupedAssignments}
          onLabelChange={handleLabelChange}
          onSelectColor={handleColorSelect}
          onClearColor={handleClearColor}
          onDownloadCsv={handleDownloadCsv}
          onClearAll={handleClearAll}
          onUploadCsv={handleUploadCsv}
        />
      </main>
    </div>
  );
}

export default App;
