# Sellers Logística - Vite

Aplicación generada desde el Excel `Todas las tiendas(1).xlsx`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy en Vercel

Opción estándar:
- Framework: Vite
- Install Command: npm install --no-audit --no-fund
- Build Command: npm run build
- Output Directory: dist

Opción rápida/precompilada:
- Framework: Other
- Install Command: echo skip install
- Build Command: echo skip build
- Output Directory: dist

La app no tiene botón de importar. Exporta todos los datos editados a XLSX.
Los cambios se guardan en localStorage del navegador.