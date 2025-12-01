import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { LatLngTuple } from 'leaflet';

export interface CommuneProperties {
  cut: number;
  comuna: string;
  region: number;
  region_1: string;
}

export type CommuneGeometry = Polygon | MultiPolygon;

export type CommuneFeature = Feature<CommuneGeometry, CommuneProperties>;

export type CommuneFeatureCollection = FeatureCollection<CommuneGeometry, CommuneProperties>;

export type CommuneLabel = {
  id: string;
  name: string;
  position: LatLngTuple;
};
