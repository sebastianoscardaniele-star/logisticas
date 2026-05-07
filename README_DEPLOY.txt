DEPLOY EN VERCEL SIN NPM

Usar estos valores:

Framework Preset: Other
Install Command: echo skip install
Build Command: echo skip build
Output Directory: .

Este ZIP NO tiene package.json, package-lock.json, node_modules, src ni vite.config.js.
Si Vercel muestra "Installing dependencies", estás subiendo otro repo/ZIP que todavía tiene package.json.