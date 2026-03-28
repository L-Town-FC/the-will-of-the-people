# Deployment Scripts

These scripts support the bot's image build and container deployment workflow.

## Current Deployment Model

The bot is built as a Docker image and pushed to Docker Hub. Deployments then pull that image onto the machines where the bot runs and start the container locally with Docker.

Today the rough flow is:

1. Normal pushes to `main` build both AMD64 and ARM64 images
2. Those images are pushed to Docker Hub as `latest` and the short commit SHA
3. Semver release tags publish only the matching semver image tag
4. Runtime hosts pull an explicit image tag and launch the bot with Docker using the production token and a persistent JSON volume

## Infrastructure History

The bot originally ran on AWS, but that became too expensive over time. It was then moved to a Raspberry Pi 3 and later migrated again to a Raspberry Pi 5.

The AWS deployment path is no longer the primary target, but the script is still kept here in a similar shape to the Raspberry Pi deployment flow.

For local container workflows, the repository also exposes `make` targets that wrap Docker Compose.

## Script Intent

- `build.sh`: build and push a single-architecture image; defaults to `latest` + short SHA or accepts an explicit tag argument
- `buidx.sh`: build and push a multi-architecture image; defaults to `latest` + short SHA or accepts an explicit tag argument
- `deploy_rpi.sh`: connect to the Raspberry Pi host, pull the selected image tag, and restart the bot container
- `deploy_aws.sh`: legacy AWS deployment path kept in a similar pattern
- `restart_container.sh`: local helper for pulling and rerunning the container with the expected env vars and volume mount
- `time_info.sh`: lightweight timestamp helper used by the scripts
- `image_version.sh`: shared helper that resolves `APP_VERSION` and Docker tags for build and deploy scripts

## Runtime Contract

The bot container is expected to run with:

- `PRODBOTTOKEN`
- `NODE_ENV=production`
- `JSONPATH=/usr/src/bot/volume`
- Docker volume: `bot-vol:/usr/src/bot/volume`

That matches how the bot persists its JSON data outside the container filesystem.

The image also bakes in:

- `APP_VERSION` — `vX.Y.Z` for release-tag builds, short commit SHA for normal `main` builds, or `unknown` as a fallback

## Future Direction

The current scripts are mostly used locally and manually today. The likely next step is to automate Raspberry Pi deployments so the latest image can be pulled and restarted with less manual intervention.

## Useful Make Targets

- `make build`: run the single-architecture image build/push helper
- `make build_multi_arch`: run the multi-architecture build/push helper
- `make deploy_pi`: deploy the latest image to the Raspberry Pi host
- `make deploy_aws`: run the legacy AWS deployment path
- `make compose_build`: build the local Docker Compose service
- `make compose_up`: start the bot service with Docker Compose
- `make compose_down`: stop the local Docker Compose stack
- `make compose_restart`: rebuild and restart the bot service with Docker Compose
- `make compose_logs`: follow the bot service logs

## Tagging Behavior

- `scripts/build.sh` and `scripts/buidx.sh` with no argument:
  publish `latest` and the current short commit SHA, with `APP_VERSION` set to that short SHA
- `scripts/build.sh v2.2.3` or `scripts/buidx.sh v2.2.3`:
  publish only `v2.2.3`, with `APP_VERSION=v2.2.3`
- `scripts/deploy_rpi.sh` and `scripts/deploy_aws.sh`:
  deploy the first resolved tag by default, or honor `DEPLOY_TAG` / an explicit tag argument so operators can roll forward or backward intentionally
