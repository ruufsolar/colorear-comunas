import type { Feature as GeoFeature, GeoJsonObject } from 'geojson';
import type { LatLngBoundsExpression, Layer, PathOptions } from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import type { GeoJSONProps, MapContainerProps, TileLayerProps } from 'react-leaflet';
import { GeoJSON, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_GRAY, paletteById } from '../data/palette';
import type { CommuneFeature, CommuneFeatureCollection, CommuneLabel } from '../types/geo';
import type { ColorAssignments } from '../utils/storage';

type ChileMapProps = {
  data?: CommuneFeatureCollection;
  regionBoundaries?: GeoJsonObject | null;
  assignments: ColorAssignments;
  bounds?: LatLngBoundsExpression;
  onCommuneClick: (feature: CommuneFeature) => void;
  selectedCommuneId?: string;
  labels: CommuneLabel[];
};

type LabelLayerProps = {
  labels: CommuneLabel[];
  zoomThreshold: number;
  onZoomStateChange: (isZoomedIn: boolean) => void;
};

const LabelLayer = ({ labels, zoomThreshold, onZoomStateChange }: LabelLayerProps) => {
  const map = useMap();
  const [visibleLabels, setVisibleLabels] = useState<CommuneLabel[]>([]);

  const updateLabels = useCallback(() => {
    const zoom = map.getZoom();
    const canShowLabels = zoom >= zoomThreshold;
    onZoomStateChange(canShowLabels);
    if (!canShowLabels) {
      setVisibleLabels([]);
      return;
    }
    const bounds = map.getBounds();
    const next = labels.filter((label) => bounds.contains(label.position));
    setVisibleLabels(next);
  }, [labels, map, onZoomStateChange, zoomThreshold]);

  useEffect(() => {
    updateLabels();
  }, [updateLabels]);

  useMapEvents({
    moveend: updateLabels,
    zoomend: updateLabels,
  });

  return (
    <>
      {visibleLabels.map((label) => (
        <Tooltip
          key={label.id}
          position={label.position}
          permanent
          direction='center'
          className='commune-tooltip'
        >
          {label.name.toLowerCase()}
        </Tooltip>
      ))}
    </>
  );
};

const ChileMap = ({
  data,
  regionBoundaries,
  assignments,
  bounds,
  onCommuneClick,
  selectedCommuneId,
  labels,
}: ChileMapProps) => {
  const [labelZoomReady, setLabelZoomReady] = useState(false);
  const featureStyle = useCallback(
    (feature: CommuneFeature | undefined): PathOptions => {
      if (!feature) {
        return {
          fillColor: DEFAULT_GRAY,
          color: '#ffffff',
          weight: 0.6,
          fillOpacity: 0.82,
        };
      }
      const id = String(feature.properties.cut);
      const colorId = assignments[id];
      const color = colorId ? paletteById[colorId] : undefined;
      const isSelected = selectedCommuneId === id;

      return {
        fillColor: color?.hex ?? DEFAULT_GRAY,
        color: isSelected ? '#111827' : '#ffffff',
        weight: isSelected ? 2 : 0.6,
        fillOpacity: isSelected ? 0.95 : 0.82,
      };
    },
    [assignments, selectedCommuneId]
  );

  const bindEvents = useCallback(
    (feature: CommuneFeature | undefined, layer: Layer) => {
      if (!feature) return;
      layer.on('click', () => onCommuneClick(feature));
    },
    [onCommuneClick]
  );

  if (!data || !bounds) {
    return <div className='map-placeholder'>Cargando mapa…</div>;
  }

  const mapProps = {
    bounds,
    className: 'map-viewport',
    minZoom: 4,
    worldCopyJump: false,
    preferCanvas: true,
  } satisfies MapContainerProps;

  const tileLayerProps = {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  } satisfies TileLayerProps;

  const communeLayerProps = {
    data: data as GeoJsonObject,
    style: (feature: GeoFeature | undefined) => featureStyle(feature as CommuneFeature),
    onEachFeature: (feature: GeoFeature, layer: Layer) =>
      bindEvents(feature as CommuneFeature, layer),
  } satisfies GeoJSONProps;

  const regionLayerProps = regionBoundaries
    ? ({
        data: regionBoundaries,
        style: () => ({
          color: '#111827',
          weight: 2.5,
          fillOpacity: 0,
          dashArray: '4 4',
        }),
      } satisfies GeoJSONProps)
    : null;

  return (
    <div className='map-wrapper'>
      {!labelZoomReady && (
        <div className='zoom-hint'>Acércate para ver los nombres de cada comuna</div>
      )}
      <MapContainer {...mapProps}>
        <TileLayer {...tileLayerProps} />
        <GeoJSON key='communes' {...communeLayerProps} />
        {regionLayerProps && <GeoJSON key='regions' {...regionLayerProps} />}
        <LabelLayer labels={labels} zoomThreshold={5.8} onZoomStateChange={setLabelZoomReady} />
      </MapContainer>
    </div>
  );
};

export default ChileMap;
