# Daymark Task Manager

A responsive kanban task manager built with React and Vite. Tasks are saved in
the browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

The production files are written to `dist/`. Relative asset paths allow the
build to be hosted from a subdirectory, such as `/task-manager/`.

## Deployment

Pushes to `main` are built and published to GitHub Pages by
`.github/workflows/deploy.yml`. The site is served at
https://rryutatsu.github.io/Repostory2/.

## Windows desktop app

The same app is packaged for Windows with Electron (`electron/main.cjs`).

```sh
npm run desktop    # build and open the desktop window
npm run dist:win   # build release/Daymark-Setup-<version>.exe and a portable .exe
```

`.github/workflows/windows-app.yml` builds the Windows installers on every push
and pull request and uploads them as the `Daymark-Windows` artifact.
