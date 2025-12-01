# Colorear Comunas

Aplicación React/Vite para visualizar las comunas de Chile, asignar colores a grupos y exportar/importar tu progreso.

## Desarrollo local

```bash
npm install
npm run dev
```

El dataset (`Comunas_de_Chile.topojson`) se encuentra en `public/data`.

## Flujo de trabajo

- Clic en una comuna para seleccionarla y usa la paleta para asignar uno de los 10 colores predefinidos.
- Los colores se guardan en `localStorage`.
- Desde el panel derecho puedes descargar un CSV con todas las asignaciones o cargar uno previamente exportado para continuar el trabajo.

## Build

```bash
npm run build
```

El resultado se publica en `dist/` y se puede desplegar en cualquier hosting estático.*** End Patch
