# The Will of the People

Part joke, part institution, this bot became the engine of the server's economy, the house behind its casino, and the voice of its occasional cruelty. Some might even call it a monster. What started as a bit slowly turned into a shared system everyone pushed, tested, argued with, and added to until it became, in its own strange way, the collective will of the people.

## What it does

- Runs a Discord.js bot from `index.js`
- Loads command modules from `commands/`
- Stores bot state in tracked JSON files under `JSON/`
- Supports local development with `nodemon`
- Includes lightweight JSON sanity tests for developer changes
- Exposes a `!version` command backed by the image's baked-in `APP_VERSION`

## Project layout

- `index.js`: bot startup, event handlers, and command routing
- `commands/`: user-facing bot commands
- `commands/Functions/`: shared helpers for stats, achievements, embeds, and general command behavior
- `JSON/`: tracked bot state and command metadata
- `scripts/`: deployment helpers
- `test/`: lightweight JSON sanity tests

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` file with the values you need.

Common variables used by the bot:

- `DEVBOTTOKEN`: token used when running with `NODE_ENV=local`
- `PRODBOTTOKEN`: token used in production mode
- `JSONPATH`: optional external path for persistent JSON storage; defaults to `./JSON` when unset
- deploy-related values such as `EC2_HOST`, `EC2_USER`, `PI_HOST`, `PI_USER`, and `PATH_TO_KEY`

3. Start the bot locally:

```bash
npm run start:dev
```

If you only want to inject the dev token for one shell session, this also works:

```bash
export DEVBOTTOKEN=your_dev_token
npm run start:dev
```

## Tests

Run the lightweight sanity suite with:

```bash
npm test
```

Current checks:

- `test/json-names.test.js`: verifies approved user names across `master.json`, `stats.json`, and `tracker.json`
- `test/json-shape.test.js`: verifies those JSON files share the same user ids and required core fields

Lint the codebase with:

```bash
npm run lint
```

## Development notes

- The bot reads command files dynamically from `commands/`, but commands still need to be wired into the `switch` in `index.js`.
- `JSONPATH` is optional. If it is missing, the bot logs `Null database path found` and falls back to the local tracked JSON directory.
- `nodemon.json` ignores the JSON state files so normal bot activity does not constantly restart local development.
- `APP_VERSION` is baked into container images at build time. Release-tag builds use the semver tag, and normal `main` builds use the short commit SHA.

## Deployment scripts

The helper scripts live in `scripts/`:

- `scripts/build.sh`
- `scripts/buildx.sh`
- `scripts/deploy_aws.sh`
- `scripts/deploy_rpi.sh`
- `scripts/restart_container.sh`

The `makefile` exposes a few shortcuts for common tasks:

```bash
make build
make deploy_aws
make deploy_pi
make dev
```
