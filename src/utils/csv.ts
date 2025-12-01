import { palette, paletteById } from '../data/palette';
import type { CommuneFeature } from '../types/geo';
import type { ColorAssignments, LegendLabels } from './storage';

const headers = ['comuna', 'cut', 'region_num', 'region_codigo', 'color_id', 'color_hex', 'grupo'];

const escapeCsv = (value: string | number) => {
  const raw = String(value ?? '');
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

export const buildCsv = (
  assignments: ColorAssignments,
  featureIndex: Record<string, CommuneFeature>,
  labels: LegendLabels
) => {
  const rows: string[] = [headers.join(',')];

  Object.entries(assignments).forEach(([cut, colorId]) => {
    if (!colorId) return;
    const feature = featureIndex[cut];
    if (!feature) return;
    const paletteColor = paletteById[colorId];
    const label = labels[colorId] ?? paletteColor?.defaultLabel ?? '';
    const { comuna, region, region_1 } = feature.properties;

    const line = [
      escapeCsv(comuna),
      escapeCsv(cut),
      escapeCsv(region),
      escapeCsv(region_1),
      escapeCsv(colorId),
      escapeCsv(paletteColor?.hex ?? ''),
      escapeCsv(label),
    ].join(',');
    rows.push(line);
  });

  return rows.join('\n');
};

export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type ParsedCsvResult = {
  assignments: ColorAssignments;
  labels: LegendLabels;
};

export const parseAssignmentsCsv = (text: string): ParsedCsvResult => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    throw new Error('El archivo CSV está vacío.');
  }

  const header = parseCsvLine(lines[0]);
  if (header.length < headers.length || headers.some((key, index) => header[index] !== key)) {
    throw new Error('El CSV no tiene el formato esperado.');
  }

  const assignments: ColorAssignments = {};
  const labels: LegendLabels = {};

  lines.slice(1).forEach((line) => {
    const columns = parseCsvLine(line);
    if (columns.length < headers.length) return;
    const cut = columns[1];
    const colorId = columns[4];
    const groupName = columns[6];

    if (!cut || !colorId) return;
    assignments[cut] = colorId;
    if (groupName) {
      labels[colorId] = groupName;
    }
  });

  palette.forEach((color) => {
    if (!labels[color.id]) {
      labels[color.id] = color.defaultLabel;
    }
  });

  return { assignments, labels };
};
