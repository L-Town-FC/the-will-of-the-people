# Contributing

## Conventional commits

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>)!: <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

Breaking changes: add `!` after the type/scope, e.g. `feat!: redesign api`.

**Local commits** are validated by two `.githooks` hooks (auto-installed on `npm install`):
- **`commit-msg`** — validates the commit message format.
- **`pre-commit`** — runs format check (`eslint --fix` + diff), lint, and tests before every commit. Aborts if any fail.

**PR titles** are validated by CI in `pr-checks.yml`.

If a commit is rejected by a hook, fix the issue and retry. Use `git commit --no-verify` to bypass in exceptional cases.

## Pull request process

1. Create a branch from `main` with a conventional commit name, e.g. `feat/add-widget`, `fix/bug-42`.
2. Make your changes and commit with conventional commit messages.
3. Open a PR against `main`. The title must follow conventional commit format.
4. The `autolabel` workflow labels your PR automatically. Labels can be adjusted manually:
   - **Semver override**: apply `semver:major`, `semver:minor`, or `semver:patch` to control the version bump on release.
   - **Skip changelog**: apply `skip-changelog` to exclude from release notes.
5. CI runs `pr-checks.yml` (format, lint, tests, title validation). All must pass.
6. Merge via **squash merge** (the squash message defaults to the PR title).

## Local development

```bash
npm install               # install deps + install githooks
npm run start:dev         # run bot locally with dev token
npm test                  # run tests
npm run lint              # lint codebase
```

## Building and deploying

Docker images are published to GHCR (`ghcr.io/L-Town-FC/the-will-of-the-people`):

```bash
make build         # build and push single-arch
make build-multi   # build and push multi-arch (amd64 + arm64)
make deploy_pi     # deploy to production Pi
```

The release workflow handles production deployments. See `.github/workflows/release.yml` for details. Use the `dry_run` input to preview before committing.

## Code style

- No comments in source files unless necessary for clarity.
- Follow existing patterns in `commands/` and `index.js`.
- JSON files under `JSON/` are git-tracked — update tests if their shape changes.
