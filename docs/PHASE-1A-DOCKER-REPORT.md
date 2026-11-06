# Navapack Finance — Phase 1A Docker implementation

Date: 5 November 2026 (Asia/Calcutta).

## Current result — 6 November 2026

**Open browser blocker:** User's login screenshot is unstyled. Proxy logs show 404s for bare bundle names such as `/login.bundle.css` and `/frappe-web.bundle.js`. File inspection confirms compiled CSS exists but `sites/assets/assets.json` is 2 bytes. The custom-app-only build generated an empty manifest in the fresh sites/assets directory and copied it over the base manifest. Changed Containerfile.app to `bench build --production` for all installed apps so the manifest and all compiled assets are generated together before copying into baked assets. Corrected image rebuild and project-scoped container refresh are pending manual execution. Do not mark Phase 1A complete until asset HTTP requests and browser login pass. Do not reinitialize either site or restore/delete volumes for this repair.

**Local Docker installation running; manual verification passed for primary and restored sites. Browser login remains unconfirmed.** This current result supersedes the historical blocked/preparation-only status entries below. All Docker execution evidence was supplied by the user from normal Windows PowerShell; the agent did not execute Docker commands.

- Primary URL: http://finance.localhost:8082 (fallback http://127.0.0.1:8082 with configured fixed site routing). Only 127.0.0.1:8082 is published; MariaDB/Redis remain internal.
- Compose project: navapack-finance. Docker physical disk image location confirmed by user screenshot: F:\DockerData\DockerDesktopWSL.
- Foundation commit: fbf76edcf5791b1d9743955b85caf0a19974d5a6.
- Installed versions confirmed before and after stop/start: Frappe 16.55.1, ERPNext 16.53.0, navapack_finance 0.0.1. Base tooling: Python 3.14.0, Node 24.14.0, Bench 5.31.1.
- Runtime image: navapack-finance:16.53.0-frappe16.55.1-local. User's build output records manifest-list digest sha256:2d80b73cf89815183bc2c8df842278686b17f3674ec633e63f06c0ba44b6fe68.
- MariaDB 11.8.5 digest: sha256:345fa26d595e8c7fe298e0c4098ed400356f502458769c8902229b3437d6da2b. Redis 8.6.0-alpine digest: sha256:fd83658b0e40e2164617d262f13c02ca9ee9e1e6b276fd2fa06617e09bd5c780.
- Observed containers: navapack-finance-backend-1, frontend-1, websocket-1, scheduler-1, queue-short-1, queue-long-1, configurator-1, db-1, redis-cache-1 and redis-queue-1 (all names carry the navapack-finance prefix). Database, cache, queue and proxy health checks passed; runtime services up; configurator exit 0.
- Named volumes: navapack-finance_sites, navapack-finance_logs, navapack-finance_db-data, navapack-finance_redis-queue-data.
- Primary metadata checks PASS: Account, Journal Entry, GL Entry, Sales Invoice, Purchase Invoice, Payment Entry and General Ledger report definition. No real accounting postings or company-dependent report execution tested.
- Primary HTTP ping PASS. Two workers online; scheduler enabled. Actual queued-job completion has not been independently demonstrated.
- Stop/start persistence PASS for initialized site, installed apps and accounting metadata. No volume deletion or container-recreation test performed.
- Backup PASS: database, config, public/private archives in set 20261106_003914-finance_localhost, copied to ignored local backups with SHA256 output.
- Restore PASS: Bench reports `Site finance-restore.localhost has been restored with files`; scheduler disabled on restore site. VerifyRestore confirms the same three installed app versions and accounting_metadata PASS. This is a fresh-site recovery drill; populated-upload integrity and transaction-level data recovery are not demonstrated by these metadata checks.

Remaining: confirm Administrator login to the primary site in a browser. Keep primary services running; do not repeat Initialize or Restore against existing sites. No SSO, production deployment, commits, pushes or changes to existing Django/React applications were performed. See PHASE-1A-MANUAL.md for exact commands. Future production security, ownership/licensing decisions and client handover remain separate work.

## Configuration preparation update — 5 November 2026

**PREPARED, NOT EXECUTED.** Following the latest instruction, no Docker commands were executed during this preparation turn. Added Finance-local ignore/build-context rules, a Compose override based on the official upstream services, custom app image recipe, staged PowerShell runner, initialization/verification/restore helpers, backend source-generation notes and `PHASE-1A-MANUAL.md`.

PowerShell parser, Python AST syntax, YAML parsing and static localhost/database/cache port-isolation checks passed. Docker Compose validation, image builds, app generation, site initialization, all database/schema operations, HTTP, workers/scheduler, persistence, backup and restore remain unexecuted. No financial transactions, commits, pushes or deployment occurred. Existing Django work, Navapack React and Finance preview were preserved.

Exact upstream commit and MariaDB/Redis/Python patch image digests deliberately remain unresolved until the manual review/locking phase. Source metadata confirms the requested Frappe/ERPNext declared version range. Build dependencies and full runtime compatibility remain unverified. The scripts pin key inputs but do not provide a fully hermetic dependency lock; see the runbook's reproducibility limitations and approval gates.

Manual execution instructions: [PHASE-1A-MANUAL.md](PHASE-1A-MANUAL.md). The historical failed access attempts below remain as evidence, not new execution results.

## Status

### Manual runtime evidence — 6 November 2026

User-run Backup completed successfully for set `20261106_003914-finance_localhost`: site_config_backup.json (216 B), database.sql.gz (933.9 KiB), files.tgz (144 B), private-files.tgz (142 B). Compose copied the backup set into ignored local backups storage and printed four SHA256 values; the pasted table truncated filenames, so individual hash-to-file associations are not recorded here. Small file archives are consistent with a fresh site and do not establish populated-upload recovery. Corrected restore helper archive suffixes to match observed `.tgz` names; Python syntax passed. Restore remains pending and targets only absent `finance-restore.localhost`, refusing overwrite.

User-supplied stop/start transcript confirms all Finance services stopped and restarted successfully without deleting volumes. Subsequent Verify reports MariaDB, Redis cache/queue and frontend healthy; configurator exit 0; other runtime services up; installed versions unchanged (Frappe 16.55.1, ERPNext 16.53.0, navapack_finance 0.0.1). Primary site accounting metadata checks PASS, two workers online and HTTP ping PASS after restart. This confirms the initialized site and app/schema availability persist across service stop/start; container recreation and transaction/file persistence were not tested. Backup, separate-site restore, browser login and asynchronous job completion remain unverified.

The absolute sites_path change alone did not fix logging; the user reported the identical `/home/frappe/logs/database.log` error. Corrected the standalone verifier's working directory to `/home/frappe/frappe-bench/sites` before Frappe initialization, matching Bench site-command execution and resolving relative ../logs inside Bench. No missing log directory was created as a workaround. Syntax, working-directory initialization order and BOM checks passed. Attempts to retrieve tagged logger source were unavailable in this session; runtime confirmation remains pending the user's retry.

The subsequent verifier retry reached frappe.connect but failed creating `/home/frappe/logs/database.log`. The standalone helper supplied a relative sites_path; changed it to `/home/frappe/frappe-bench/sites` so Frappe derives the correct Bench/log paths. Python syntax and BOM-free encoding checks passed. No log directory, database, container configuration or permissions were changed; manual verification retry remains pending.

User-provided output confirms the final custom image built, project network and sites/logs/db-data/redis-queue-data named volumes were created, and site `finance.localhost` installed Frappe 16.55.1, ERPNext 16.53.0 and navapack_finance 0.0.1. Scheduler enablement completed. Verify output reports MariaDB, both Redis containers and frontend healthy; backend, websocket, scheduler and both workers running; configurator exited 0. Only 127.0.0.1:8082 is published. These are manual execution observations, not agent Docker execution.

Accounting verifier failed on U+FEFF introduced by the PowerShell text pipeline. Replaced the pipeline/Bench expression execution with Compose cp of BOM-free script bytes and direct Bench-virtualenv Python execution. The helper now initializes the specified Finance site, checks metadata/versions and rolls back its database connection before destroying context. Applied to primary and restore verification. Python syntax, BOM absence and PowerShell syntax checks passed locally; manual runtime retry remains required. HTTP ping, browser login, worker/scheduler diagnostics, restart persistence, backup and restore verification remain pending. Do not interpret historical initial-blocker status below as the current container state.

### Manual base build — verification correction

The user subsequently verified all expected base versions: ERPNext 16.53.0, Frappe 16.55.1, Python 3.14.0, Node v24.14.0 and Bench 5.31.1. Generate then reported `ModuleNotFoundError: No module named 'frappenerpnextn'` before its App Title prompt. Its printf expression was corrupted by Windows native argument quoting. Replaced it with `ls -1 apps > sites/apps.txt`, matching the successful base verifier and official configurator approach. PowerShell syntax passed. Requested cancellation at the prompt and a fresh Generate retry; no deletion or Docker command was performed by the agent.

The next user-run VerifyBase printed ERPNext 16.53.0, Frappe 16.55.1 and Python 3.14.0, then failed with `node: command not found` (exit 127). The image recipe installs Node through NVM and includes its current/bin directory in ENV PATH. Changed runner container shell invocations from login `bash -lc` to non-login `bash -c` to preserve the image PATH, including subsequent app-generation and site-tool commands. This addresses a likely login-shell PATH reset; Node/Bench verification still requires the next manual retry. No image rebuild or Docker operation was performed by the agent. PowerShell syntax passed.

The user's BuildBase output shows image export/unpacking to `navapack-finance-base:16.53.0-frappe16.55.1` followed by a failed disposable verification container: `OSError: b'./apps.txt' Not Found`. The verifier mounted an empty tmpfs over sites, hiding the image's apps.txt, and bypassed the normal configurator. This was a runner defect, not evidence of an ERPNext installation failure.

Corrected the verifier to regenerate sites/apps.txt from image app directories before Bench commands. Added `VerifyBase` to retry verification using the existing local image without rebuilding or pulling. It creates no site/database and uses disposable tmpfs for sites/logs. PowerShell syntax validation passed; Docker execution remains manual and verification results are pending. No Docker commands were executed by the agent for this correction.

**BLOCKED — ERPNext is not running or verified.** Installation has not begun. The user approved the isolated implementation, with a separate approval requirement for additional privileges, service changes, system configuration changes, and destructive operations.

## Completed work

### Resume attempt — 5 November 2026

The user reports Docker Desktop 4.93.0 running successfully from normal Windows PowerShell, Client/Server 29.8.1, Compose 5.5.1, WSL2 Linux engine, 12 CPUs, 7.432 GiB Docker memory and no running containers. These are user-provided observations, not independently verified from this session.

Retried read-only commands from the current execution environment:

```powershell
docker version
docker context show
docker compose version
```

Observed Docker client 29.8.1, context `desktop-linux`, Compose v5.5.1. The server query still returned:

```text
permission denied while trying to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

The combined shell command exited 0 because the final Compose version command succeeded; this does **not** mean server access succeeded. Installation stopped as explicitly instructed. No elevated retry, permissions/group/security changes, system configuration changes or alternative access bypass was attempted. Docker inventory, virtual disk location, capacity validation, port 8082, WSL integration and current resource utilization remain unverified in this session. Installation and all runtime tests remain pending.

- Inspected the Finance workspace and prior preflight reports without modifying existing applications.
- Confirmed Docker CLI 29.8.1, Docker Compose v5.5.1, and selected context `desktop-linux`.
- Attempted `docker desktop status` and `docker desktop start`. Status could not be retrieved; startup failed because the launcher could not find registry key `SOFTWARE\Docker Inc.\Docker Desktop` in this execution environment.
- Located Docker CLI at `C:\Users\nidhi\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe`.
- Requested Docker Desktop launch with `Start-Process -FilePath 'C:\Users\nidhi\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe' -WindowStyle Hidden`. The command returned successfully, but this is not evidence that the engine started.
- Rechecked engine access with `docker version --format '{{json .Server}}'`: returned `null` and `permission denied while trying to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- Earlier WSL status/list and CIM resource queries returned access denied. Port inventory is not established; empty restricted-session output is not proof that ports are free.
- Initial drive inspection reported approximately 14 GiB free on C: and 399 GiB on F:. Docker storage placement and build capacity remain unverified.

## Selected versions and official foundation

- Frappe v16.55.1: https://github.com/frappe/frappe/releases/tag/v16.55.1
- ERPNext v16.53.0: https://github.com/frappe/erpnext/releases/tag/v16.53.0
- ERPNext tagged metadata declares Frappe `>=16.50.0,<17.0.0` and Python `>=3.14`; selected Frappe satisfies the declared application range: https://raw.githubusercontent.com/frappe/erpnext/v16.53.0/pyproject.toml
- Official custom image and Compose foundation: https://github.com/frappe/frappe_docker
- Build instructions: https://raw.githubusercontent.com/frappe/frappe_docker/main/docs/02-setup/02-build-setup.md
- Official MariaDB override inspected uses MariaDB 11.8: https://raw.githubusercontent.com/frappe/frappe_docker/main/overrides/compose.mariadb.yaml

These are candidate source pins verified against official sources, not an installed or tested combination. Exact frappe_docker commit, base/runtime image digests, MariaDB/Redis patch pins, and image/platform compatibility are pending accessible-engine checks and upstream reference resolution. No floating source checkout or image build has been performed.

## Installation and verification results

- Local URL: proposed `http://finance.localhost:8082`; **not available or verified**.
- Site: proposed `finance.localhost`; not created.
- Compose project: proposed `navapack-finance`; not created.
- Containers, networks and named volumes: none created by this task; existing inventory inaccessible.
- Custom app: not generated; requires official Bench tooling in an isolated Linux container.
- Installed apps/versions: none verified.
- Container health, HTTP/login, workers and scheduler: not tested.
- Account, Journal Entry, GL Entry/General Ledger report, Sales Invoice, Purchase Invoice and Payment Entry: not tested.
- Startup/shutdown and persistence: not tested.
- Backup and restore into a separate disposable site: not tested; no backups created.

## Next steps

1. Resume from an execution environment with legitimate Docker API access. The current sandbox remains denied; the latest user instruction requires stopping on that restriction. Do not change Windows permissions, groups, Docker security or system configuration to bypass it.
2. Retry read-only engine access there before implementation. Docker Desktop is already running according to the user's normal PowerShell verification; no restart is needed merely because this sandbox cannot access it. Any new privileged operation requires separate approval.
3. Inventory existing Docker resources, WSL2 integration, available memory/storage and occupied ports; ensure 8082 is free and capacity is sufficient.
4. Resolve exact upstream commit/image pins and verify compatibility before downloading/building installation images.
5. Generate `navapack_finance` through `bench new-app`; build it into the pinned custom runtime image with assets and Bench app discovery configured.
6. Implement official Compose services with project-scoped named volumes and localhost-only HTTP publishing. Keep MariaDB/Redis internal and credentials in ignored local files.
7. Create the disposable site, install ERPNext/custom app and run all requested functional, persistence, backup and separate-site restore tests.
8. Replace pending entries in this report with actual commands, versions, resource names and evidence. Leave the primary site running only after verification succeeds.

## Scope preservation

No existing frontend, Django backend or Finance React preview files were modified. No existing Docker resource was modified or removed by task commands. No storage/resource/system configuration changes, credentials, SSO, real accounting transactions, commits, pushes or deployment were performed. The initial blocked attempt created only this report. The later configuration-only preparation added files listed in the preparation update above.
