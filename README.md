# Банки України

Originally created with Create React App, now migrated to [Vite](https://vitejs.dev/)
(React + TypeScript toolchain).

## Develop

```
npm install
npm install --legacy-peer-deps

npm run dev        # starts the Vite dev server on http://localhost:3000
```

## Build

```
npm run build      # bundles into the build/ directory
npm run preview     # serves the production build locally
```

`npm run typecheck` runs `tsc --noEmit` (TypeScript is configured with `allowJs`, so the
legacy `.js` sources are not type-checked).

## Data pipeline (Node scripts, run with babel-node)

The `src/node/` and `server/app/` folders are Node-only scripts, unchanged by the Vite
migration and still run via `babel-node` (configured by `.babelrc`):

```
npx babel-node src/node/main.js          # regenerates public/data/*.json
npx babel-node server/app/refresh.js     # data-refresh server on port 3333 (used by the Refresh page)
```

## Deploy on Firebase

```
npm run build

firebase login
firebase use --add
firebase init
- Hosting: Configure and deploy Firebase Hosting sites
- What do you want to use as your public directory? : build
- Configure as a single-page app (rewrite all urls to /index.html)?: y
- File build/index.html already exists. Overwrite?: n

firebase serve
firebase deploy
```

go to https://banks-3cc11.firebaseapp.com
