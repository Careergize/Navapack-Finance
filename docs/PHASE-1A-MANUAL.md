# Phase 1A — manual Docker runbook

Prepared 5 November 2026. **Configuration only; nothing installed or tested in Docker.** Run each phase separately in normal Windows PowerShell with legitimate Docker API access. Do not run the entire document as one script. No elevation or security bypass is included. The scripts stop on command failures; do not retry blindly after partial initialization.

## Scope and prerequisites

Only `finance/backend`, `finance/docker`, `finance/docs` and Finance-local ignore files are prepared. Existing Django changes and all React code are preserved. No SSO, production integration, financial transactions, commits or deployment. App generation remains a future manual action using official Bench tooling; it is not an already generated app.

Required: Git, PowerShell 5.1+ or 7, running Docker Desktop Linux engine with BuildKit, internet access to GitHub/Docker Hub/PyPI/npm/Debian, and sufficient physical storage in Docker Desktop's actual virtual disk location. The prior report of roughly 14 GiB C: free may be insufficient for source builds, cache and backups. Do not infer capacity from the guest's virtual filesystem size or from free space on F:. Obtain separate approval before disk relocation, resource allocation changes, elevation, WSL integration changes or any modification to existing services/resources. Do not run cleanup/prune/down -v commands.

The project uses `navapack-finance` and default project-prefixed resource names. If preflight finds any existing resources with this project label/name, STOP and inspect ownership before continuing; scripts must not take over an earlier stack. Services: backend, frontend, websocket, scheduler, queue-short, queue-long, configurator, db, redis-cache, redis-queue; `site-tool` runs only on demand. Named volumes: sites, logs, db-data, redis-queue-data (each prefixed `navapack-finance_`). No fixed container_name avoids collisions; actual Compose-generated names must be recorded after startup.

## 1. Read-only preflight

```powershell
Set-Location F:\WORK\ERP\finance\docker
.\Phase1A.ps1 -Phase Preflight
```

Inspect Docker Desktop Settings → Resources → Advanced for the **physical disk image location** and its host drive free space. Inspect Resources → WSL Integration, without toggling settings. Record screenshots/observations privately if needed. Confirm 8082 is free, the engine is linux/amd64, and memory/storage are adequate for a potentially large Python/Node build. `docker stats --no-stream` and inventory output are observations, not reservations. Stop on permission denied.

## 2. Review official source and prepare

Resolve and review an exact upstream commit in the official repository (the first command is read-only network access):

```powershell
git ls-remote https://github.com/frappe/frappe_docker.git refs/heads/main
$financeDockerCommit = Read-Host 'Paste the reviewed full 40-character official commit SHA'
.\Phase1A.ps1 -Phase Prepare -FrappeDockerCommit $financeDockerCommit
```

Review `upstream/compose.yaml`, `upstream/images/custom/Containerfile`, resources/core entrypoint/start scripts and the official build docs at that exact SHA. Prepare clones into an absent `upstream/` and generates two random local secrets only if `.env.local` is absent. Never display the local env file in shared logs. No passwords belong in commands, issue text or Git. Docker environment values remain inspectable to anyone with engine access; this is local isolation, not a secret vault.

Confirm upstream remains compatible with this override: service names/commands, nginx-entrypoint, sites asset copying, build secret `apps_json`, Python/Node and `bench init` flags. Stop and adapt the configuration through review if any upstream interfaces differ. Do not build merely because a script parsed successfully.

## 3. Review patch tags, lock image digests

Frappe **v16.55.1** requires Python >=3.14,<3.15. ERPNext **v16.53.0** requires Python >=3.14 and Frappe >=16.50.0,<17.0.0. This verifies the declared source range only, not a tested runtime combination.

Select published exact MariaDB 11.8.x, Redis x.y.z-alpine and Python 3.14.x-slim-trixie tags from their official image registries. Match Redis to the reviewed official override; do not assume the current main branch is appropriate for older pins. No patch/digest is fabricated here. The following prompts intentionally require verified real tags:

```powershell
$financeMariaDb = Read-Host 'Verified exact tag, e.g. mariadb:11.8.<actual patch>'
$financeRedis = Read-Host 'Verified exact tag, e.g. redis:<major>.<minor>.<actual patch>-alpine'
$financePython = Read-Host 'Verified exact tag, e.g. python:3.14.<actual patch>-slim-trixie'
.\Phase1A.ps1 -Phase Lock -MariaDbTag $financeMariaDb -RedisTag $financeRedis -PythonImage $financePython -CapacityReviewed
```

This phase downloads only the selected images and records immutable digests in ignored `versions.local.json` and `.env.local`. Review `build/Containerfile.base`: it adapts only the official Python FROM to its digest and Bench installer to **5.31.1**. Node is pinned to **24.14.0**; these tool candidates must be verified available and compatible by actual builds. Record image architecture, MariaDB runtime `--version`, Redis `--version`, and resolved digests. The reviewed upstream commit is checked on subsequent phases; changes to upstream tracked files must also be reviewed (`git -C upstream diff`).

Reproducibility limit: source release tags, upstream SHA and base/runtime image digests are controlled, but upstream Debian packages, npm/Yarn, Python transitive packages and downloaded build tools are not a complete hermetic lock. Preserve built image IDs and export/archive artifacts for exact runtime reuse. Do not describe a future rebuild as byte-for-byte reproducible.

## 4. Build base and generate app

```powershell
.\Phase1A.ps1 -Phase BuildBase
.\Phase1A.ps1 -Phase Generate
```

If the base image build completed but its version check failed with missing `apps.txt`, the corrected runner can verify the existing image without rebuilding:

```powershell
.\Phase1A.ps1 -Phase VerifyBase
```

The disposable verifier reconstructs app discovery in its temporary sites directory. Continue to Generate only after the expected versions are printed successfully.

Generate uses `bench new-app navapack_finance` interactively inside a disposable Linux container, then copies only generated source to `finance/backend/navapack_finance`. Choose approved publisher/email/license values at its prompts; do not invent organization details. Existing app source causes refusal. No Django environment or source mount is used to install this app into the runtime.

Review generated hooks and metadata. Add `required_apps = ["erpnext"]` to generated hooks if absent and declare compatible v16 dependency metadata following the generated template convention. Do not customize ERPNext core. The generated `.git` directory, if present, stays local; no commit/push is required or performed. The Finance build context excludes Git metadata and local secrets.

```powershell
.\Phase1A.ps1 -Phase BuildApp
```

The extension image copies the app source, installs it into the image's Bench virtualenv, registers it in apps.txt and builds its assets. It is not merely a source bind mount. The generated app is expected to have no third-party dependencies (`--no-deps`); review/install/lock any later custom dependencies explicitly before building.

Asset repair note: the extension recipe now builds production assets for all apps, preserving a complete Frappe/ERPNext/custom app asset manifest. An earlier custom-app-only build produced an empty assets.json and unstyled pages despite successful HTTP ping. For an existing initialized stack, run BuildApp, then Start to refresh project containers with the corrected image while preserving named volumes. Do not repeat Initialize. Clear the primary site's cache after the refresh if old bundle URLs remain, then verify actual CSS/JS responses and browser login; ping alone does not validate the UI.

## 5. Start infrastructure; initialize disposable site

```powershell
.\Phase1A.ps1 -Phase Start
```

Wait for MariaDB/Redis health and successful configurator completion. Inspect `docker compose ... ps -a` output: configurator exit 0 is expected; frontend health can fail before site creation. Do not initialize while the configurator is still running or failed. No database/cache host ports are published. Only 127.0.0.1:8082 is exposed.

The next step **creates a new site database and applies Frappe/ERPNext/custom app schema**. It is supplied for your later manual execution; it has not been executed during preparation. Run only after explicitly accepting this site-initialization step and completing earlier checks:

```powershell
.\Phase1A.ps1 -Phase Initialize
.\Phase1A.ps1 -Phase Verify
```

Initialize refuses an existing primary site. On partial failure, preserve data and diagnose; no force/drop/reinstall action is supplied. Primary URL: **http://finance.localhost:8082**. If local DNS does not resolve, use **http://127.0.0.1:8082**; nginx fixes the Frappe site header to finance.localhost. Log in as Administrator using ADMIN_PASSWORD from `.env.local`, viewed privately. Do not connect SSO or real accounting data. Browser login/Desk and native screens require manual checks.

Verifier checks installed apps, pinned app versions, accounting DocType metadata, General Ledger report definition and HTTP ping. `bench doctor` and Compose process output supply worker/scheduler evidence for review; they do not prove an asynchronous job completed. Inspect scheduler/worker logs and confirm scheduler enabled, queues connected and no exceptions. Do not claim full verification solely from metadata checks or an HTTP pong. General Ledger execution without a configured company and real invoices/payments is intentionally outside this task.

## 6. Persistence without deleting volumes

```powershell
.\Phase1A.ps1 -Phase Stop
.\Phase1A.ps1 -Phase Restart
.\Phase1A.ps1 -Phase Verify
```

Record primary site database name and installed app list privately before/after, compare versions and confirm Administrator login still works. Stop/start preserves named volumes; no volume deletion is part of the procedure. An optional Compose `down`/`up` recreation test requires inspecting that only this project is targeted; no such destructive cleanup is automated here. Leave the primary stack running after successful tests.

## 7. Backup and separate-site restore

```powershell
.\Phase1A.ps1 -Phase Backup
```

Backup uses Bench with files and compression, copies backups into ignored `docker/backups/`, and prints SHA256 hashes (not contents). Confirm matching database, public/private file archives and site config backup exist. These contain secrets and private data; keep local, restrict access through approved storage practices and retain securely outside the database volume. Do not share or commit them.

The following creates **finance-restore.localhost**, refuses any existing restore site, and restores only there. It uses the latest complete backup set from primary sites-volume storage; host copies are for retention. If backup filename conventions differ in the pinned framework, stop and adapt matching logic rather than selecting unrelated archives. No force or drop option is used.

```powershell
.\Phase1A.ps1 -Phase Restore
.\Phase1A.ps1 -Phase VerifyRestore
```

Restore preserves the new site's DB credentials, copies only encryption_key from the matching backed-up config, disables its scheduler, and checks installed apps/accounting metadata. It does not automatically migrate the restored site. If the framework requires a migration, stop and approve that specific operation separately. Primary proxy remains fixed to finance.localhost: restore HTTP access is not exposed automatically. Compare nonfinancial metadata row counts and archive file checksums/content privately to substantiate DB/file restoration; metadata verification alone is insufficient proof of complete file restoration. Restore is an isolated schema/backup drill, not real accounting transaction testing. Keep the primary site running. Do not remove the disposable restore database/site without separate explicit cleanup authorization.

## Evidence and approvals still required

Update PHASE-1A-DOCKER-REPORT.md with actual upstream SHA, all image digests/IDs and runtime versions; physical Docker disk location/free capacity; actual container names/status and health; HTTP/login and module results; worker/scheduler evidence; restart persistence observations; backup names/hashes and restore comparisons. Mark failures and unexecuted tests plainly. Credentials and site configuration contents must not enter the report.

Official sources reviewed during preparation:

- https://raw.githubusercontent.com/frappe/erpnext/v16.53.0/pyproject.toml
- https://raw.githubusercontent.com/frappe/frappe/v16.55.1/pyproject.toml
- https://github.com/frappe/frappe_docker/blob/main/compose.yaml
- https://github.com/frappe/frappe_docker/blob/main/images/custom/Containerfile
- https://github.com/frappe/frappe_docker/blob/main/docs/02-setup/02-build-setup.md
- https://raw.githubusercontent.com/frappe/frappe/v16.55.1/frappe/commands/site.py

The main-branch documentation is a reference, not the chosen foundation pin. Review the exact selected commit before executing. Additional privileged operations, Windows/Docker security changes, storage relocation, allocation changes, existing-service changes, destructive actions and production operations are not authorized by these preparation scripts.
