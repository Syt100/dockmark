# Dockmark Web

Vue 3 web UI for Dockmark. This package is intended to be run from the workspace root so it can share workspace dependencies and API proxy settings.

## Development

```sh
corepack pnpm --dir apps/web dev
```

The root `pnpm dev` command is usually preferred because it starts both the Web UI and Worker API.

## Validation

```sh
corepack pnpm --filter @dockmark/web type-check
corepack pnpm --filter @dockmark/web test
corepack pnpm --filter @dockmark/web lint
```

## Build

```sh
corepack pnpm --filter @dockmark/web build
```
