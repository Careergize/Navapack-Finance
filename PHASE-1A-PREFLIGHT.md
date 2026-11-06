# Finance Phase 1A — preflight report and approval gate

Date: 4 November 2026. **Status: preflight completed; installation has not started.**

This is an interim implementation report. The requested running ERPNext backend, custom app, database and backup/restore test are **not yet delivered**. Installation is paused at the user's explicit approval boundary. No Docker commands were executed. No privileged package, database, repository-configuration or service changes were made.

## Completed inspection

### WSL and operating systems

- Windows 11 Home Single Language; build reported by WSL: 10.0.26300.9711.
- WSL 3.0.3.0; kernel 6.18.54.1. Both registered distributions use WSL2.
- Existing distributions: `Ubuntu` and `docker-desktop`, both initially stopped. Docker was not started or used.
- The read-only Linux inspection started `Ubuntu`; this lifecycle effect is disclosed. No services were installed or reconfigured. Existing normal systemd services started with the distribution.
- Existing `Ubuntu` is **Ubuntu 24.04.3 LTS**, user `nidhinj`, home `/home/nidhinj`, with 12 visible logical CPUs.
- `wsl --list --online` lists `Ubuntu-24.04` as available. A new Ubuntu download is unnecessary merely to obtain a supported release, but a separate Finance distro is proposed for disk placement and isolation.
- Existing Ubuntu VHD storage: `C:/Users/nidhi/AppData/Local/wsl/{bf5e8137-de58-4dab-9247-c25680f60a4d}`. This was read from WSL registration, not guessed.
- WSL emits `Failed to mount Z:\\`; Linux inspection still succeeds. Do not change global mount configuration or remove the mapping during Finance setup. Recheck the warning in the new distro.
- The proposed existing-distro path `/home/nidhinj/navapack-finance` was not found. No Finance workspace was created.

### Resources and capacity gate

- Physical Windows RAM: 16,477,155,328 bytes (about 15.35 GiB); 12 logical CPUs.
- Sampled Windows free physical memory ranged from about 0.35 to 1.39 GiB during the checks. These are transient readings, not a permanent capacity specification.
- WSL reports a 7.4 GiB memory ceiling, about 6.8 GiB available at inspection, and 2 GiB unused swap. Guest availability does not establish spare physical Windows RAM.
- Windows C: free space: about **6.9 GiB**; F: about **402 GiB**; D: about **217 GiB**.
- Linux `df -h` reports a virtual root filesystem of about 1 TiB with 954 GiB available. Its sparse VHD is actually on C:, so this is **not** proof of 954 GiB physically available to install Finance.

**Decision:** do not place the Finance Bench/database/build caches in the existing C:-backed distro at present. Propose a separate Ubuntu 24.04 WSL2 instance whose virtual disk is on F:. Bench itself will still be on the Linux filesystem, not `/mnt/f`. No existing distro needs to be moved, deleted or upgraded. Recheck host RAM before large builds; close user-selected heavy applications if needed. No process was killed and no WSL memory configuration was changed.

### Dependencies actually found

Existing Ubuntu:

- `python3` at `/usr/bin/python3`, runtime **Python 3.12.3**. Preserve it; it does not satisfy Frappe v16's Python requirement.
- `git` at `/usr/bin/git`.
- No Linux executable found for `python3.14`, `node`, `yarn`, `mariadb`, `mysqld`, `redis-server`, `redis-cli`, `bench` or `uv` in the inspected shell PATH.
- `npm` resolves to `/mnt/c/Program Files/nodejs/npm`, an inherited Windows executable path. Do not use it as a Linux Node/npm installation for Bench.
- `dpkg-query` returned Python packages but no installed MariaDB/Redis/Node package versions. Blank wildcard package records are not installed version evidence.
- Running systemd units contained standard Ubuntu services (including cron, resolved, snapd and unattended-upgrades); no MariaDB/Redis/PostgreSQL/Django/Frappe unit appeared in the running-service list.

Windows:

- Python **3.11.0**, `C:/Program Files/Python311/python.exe`.
- Node **v24.14.0**, `C:/Program Files/nodejs/node.exe`.
- No Windows Bench/MariaDB/MySQL/Redis executable found by the inspected command names. This is a PATH/service-name inspection, not proof that no other copy exists anywhere on disk.
- Existing `postgresql-x64-16` service is running, process `postgres`, listening on **5432**. No connection was made to its database and no credentials/configuration were read.

### Port/service boundaries

Linux TCP listeners at inspection were DNS on port 53 only. Windows has PostgreSQL on 5432, Ollama on 11434 and assorted system/application listeners. No listeners were observed on proposed Finance ports 3306, 8002, 9002, 11002 or 13002, or the usual Redis port 6379. Ports must be rechecked immediately before startup; a snapshot is not a reservation.

Proposed later dedicated configuration, not created:

- Finance MariaDB: localhost inside the new distro, 3306, dedicated site DB/user.
- Bench HTTP: 8002; socket service: 9002.
- Bench-managed Redis cache and queue: 13002 and 11002, with dedicated generated config/PID/data paths. Do not attach Bench to a pre-existing Redis process.
- If Redis packages auto-start a default service in the new distro, capture and review its behavior during the approved package stage. Do not change existing services in `Ubuntu` or Windows.

The Linux and Windows namespaces/localhost forwarding must be tested after setup. Stop on a conflict instead of taking over a port.

## Repository inspection and impact

Actual Git roots remain:

- `F:/WORK/ERP/frontend`
- `F:/WORK/ERP/backend`

Frontend status before and after inspection is identical: 13 pre-existing modified files and two untracked files. Modified files: six sales/status/business documentation files, `scripts/check-sales-management.mjs`, `src/context/SalesManagementContext.tsx`, `src/lib/salesManagement.ts`, and four Sales page files (`CreditNotePrint`, `SalesDocuments`, `SalesReturnInspection`, `SalesWorkspace`). Untracked: `scripts/check-sales-api.mjs` and `src/lib/salesApi.ts`.

Backend status before and after inspection is clean. No React/Django files, branches, Git remotes or databases were modified. No commits or pushes were made. This report and its index link are the only intentional workspace changes in this Phase 1A preflight, both under `finance/`.

The new app Git repository does not exist yet. Proposed logical remote remains `Careergize/NAVAPACK-FINANCE`; it has not been created or configured. Later `bench new-app` may initialize its own app-local Git repository. Inspect the generated ignore rules before any staging. Track only the generated/customized app source; exclude Bench/sites, database files, private uploads, logs, backups, venvs, caches, site config and secrets. Do not commit/push or alter existing branches/remotes without further explicit approval.

## Official version verification

**Selected application release candidates:**

- Frappe **v16.55.1**, official stable release, short commit shown by release page `b1b7d48`, published 3 November 2026. [Release list](https://github.com/frappe/frappe/releases), [tagged Python metadata](https://raw.githubusercontent.com/frappe/frappe/v16.55.1/pyproject.toml).
- ERPNext **v16.53.0**, official stable release, short commit shown by release page `9cd11b1`, published 28 October 2026. Its tagged metadata requires **Frappe >=16.50.0,<17.0.0**. Frappe 16.55.1 satisfies this declared range. [Release list](https://github.com/frappe/erpnext/releases), [tagged dependency declaration](https://raw.githubusercontent.com/frappe/erpnext/v16.53.0/pyproject.toml).
- Frappe Bench **v5.31.1**, official stable release, short commit `660bc28`, published 23 October 2026. Its release notes explicitly address v16/Python 3.14/Node 24 tooling. Tagged metadata requires Python >=3.10 and includes uv ~=0.13.5; the selected app installer also validates app dependencies. Use native Bench commands, not the easy-install/container workflow. [Official release](https://github.com/frappe/bench/releases/tag/v5.31.1), [tagged package metadata](https://raw.githubusercontent.com/frappe/bench/v5.31.1/pyproject.toml), [tagged installer](https://raw.githubusercontent.com/frappe/bench/v5.31.1/bench/app.py).

**Required dependency lines verified:**

- Frappe v16.55.1: Python **>=3.14,<3.15**. ERPNext v16.53.0: Python >=3.14. Install a separate 3.14 runtime; do not replace Ubuntu's 3.12.
- Frappe v16.55.1 Node engine: **>=24**. Proposed Node pin: **24.14.0**, also referenced by the Bench release; Windows's existing Node is not reused inside Linux. [Tagged Node metadata](https://raw.githubusercontent.com/frappe/frappe/v16.55.1/package.json).
- Official v16 install requirements: **MariaDB 11.8**, **Redis/Valkey 6+**, Yarn **1.22+**, pip **25.3+**. [Official installation requirements](https://docs.frappe.io/framework/user/en/installation).
- ERPNext v16.53.0's tagged MariaDB CI definition uses `py3.14-node24-mariadb11.8`, providing additional release-specific evidence for MariaDB 11.8. This is upstream CI configuration evidence, not a local test pass or a requirement to use Docker. [Tagged CI configuration](https://raw.githubusercontent.com/frappe/erpnext/v16.53.0/.github/workflows/server-tests-mariadb.yml).

**Compatibility conclusion:** the chosen application patch tags have compatible declared requirements and the proposed MariaDB line matches release-specific upstream CI. Installation, native accounting tests and backup/restore are still required to establish runtime success on this computer. No floating development branches or downgrade are proposed.

**Still to resolve before dependency installation:** exact Ubuntu MariaDB 11.8 package build, Redis package version, Python 3.14 patch runtime and bootstrap-tool pins/checksums. These depend on the clean target distro/package candidates and have not been fabricated. Record full upstream commit SHAs, package versions, sources and checksums during the next pre-install review. The eventual installed-version manifest remains pending because nothing was installed.

## Approval required now: disk-backed environment preparation only

The user explicitly requires approval before privileged/environment changes. The resource finding makes the existing distro unsuitable for an unreviewed install. The installed `wsl --help` confirms `--name`, `--location` and `--no-launch` are supported. Proposed command, **not executed**:

```powershell
wsl --install -d Ubuntu-24.04 --name Navapack-Finance --location F:\WSL\Navapack-Finance --no-launch
```

This creates a **new** WSL distribution and virtual disk at the named F: location; it does not relocate the current Ubuntu, change Windows PostgreSQL or install Frappe. It may require Windows Administrator approval. If elevation is required, stop for the user to run the exact command in an Administrator PowerShell. Do not bypass an elevation prompt or use unregister/export/import as an unapproved fallback.

After that authorized step, launch interactive first-time user setup:

```powershell
wsl -d Navapack-Finance
```

The user chooses the Linux username/password privately. Do not ask for the password in chat. Thereafter inspect `/etc/os-release`, `id`, `df`, listeners and package candidates in this new distro before proposing the privileged dependency batch.

Proposed runtime paths in the new distro (not created):

```text
/home/<linux-user>/navapack-finance/
  navapack-bench/
    apps/frappe/                  # unmodified v16.55.1
    apps/erpnext/                 # unmodified v16.53.0
    apps/navapack_finance/        # generated app; separate Git scope
    sites/finance.localhost/      # private runtime/site settings
```

The actual username is intentionally unresolved until distro initialization. This adopts the Phase 1A requested `navapack-bench` directory name rather than the earlier runbook's illustrative `bench` name.

**Not covered by this first approval:** apt operations, MariaDB repository setup, package installation, service startup/configuration, database/site creation, test-company/role creation or backup restore. Their exact commands will be shown in a separate concrete batch after the new environment is inspected. No need to approve React, gateway or synchronization changes for Phase 1A; they remain outside scope.

## Commands executed and observed results

Commands were inspection only, apart from starting the stopped Ubuntu through `wsl -d` for the inspection itself:

1. Read `finance/WSL2-SETUP.md` and `finance/PHASE-1-CHECKLIST.md`.
2. `wsl --status`, `wsl --list --verbose`, `wsl --list --online`: initially failed in the restricted sandbox with `Wsl/E_ACCESSDENIED`. A permitted read-only retry outside that sandbox succeeded. This was a sandbox restriction, not evidence that WSL was absent.
3. `git -C frontend rev-parse --show-toplevel`, backend equivalent, and `git status --short`/`--porcelain=v1`: succeeded; unchanged statuses described above.
4. `Get-Volume`, `Get-CimInstance Win32_ComputerSystem`, `Get-CimInstance Win32_OperatingSystem`, `Get-NetTCPConnection -State Listen`, filtered `Get-Service`, `Get-Command`: initial CIM access failed in the sandbox; permitted read-only external retry succeeded. Structured JSON output was used to avoid misleading blank PowerShell table columns.
5. `wsl -d Ubuntu -- bash -lc ...`: OS/user/memory/filesystem/ports/running-service inspection succeeded, but some command/format arguments were not preserved; the combined command exited 1. Dependency checks were repeated using a literal script piped to `wsl -d Ubuntu -- bash -s`, ending successfully. The resulting `node: command not found` is an observed missing dependency, not an installation failure.
6. Ubuntu probes: `cat /etc/os-release`, `id`, `uname -r`, `free -h`, `df -h / /home`, `ss -ltn`, `command -v` for tool inventory, `dpkg-query -W`, `systemctl list-units --type=service --state=running --no-pager`, `nproc`, `ls -ld` on proposed workspaces and `python3 --version`. No configuration or credential files were opened.
7. Windows `python --version`, `node --version`, selected process-name lookup, WSL Lxss registration BasePath inspection, `wsl --version`, `wsl --help` and a final resource/Git recheck.
8. Official release/documentation/tagged metadata browsing. GitHub API URLs failed through the web tool; official release pages and raw tagged repository files supplied the verification. No repositories were cloned.

No complete environment variables, process command lines, database contents, private keys, passwords, Git authentication or `.env` contents were collected. The report contains no new credentials. A credential scan of a generated app or installed-site logs is **pending**, because neither exists.

## Verification status

Completed checks: WSL2 availability, Ubuntu release and downloadable distro, disk/RAM/CPU snapshot, dependency/PATH inventory, running/listening services, Git roots/status and official application dependency compatibility evidence.

Pending, **not passed**: Frappe/ERPNext startup, Finance site HTTP load, MariaDB authentication, native installed-app list, custom app generation/install, native Account/General Ledger metadata, Redis ping, background job execution, actual accounting report execution, test roles/company, secret-scan of generated tracked content, disposable backup and restore, and full runtime independence from Django.

Task coverage: Task 1 inspected; Task 2 application/version-line evidence completed with dependency patch resolution pending; Tasks 3–8 installation/configuration/tests pending approval; Task 9 supplied here as an interim report. No claim is made that Phase 1A is complete or that Phase 1B can start yet.

## Remaining risks and rollback

- Capacity: avoid C:-backed installation; recheck Windows memory before compilation/services. Do not stop an existing application without authorization.
- Inherited Windows PATH: ensure Bench uses Linux Python/Node/npm/Yarn from the new environment, never `/mnt/c` tools.
- Repository cleanliness: preserve all existing sales work and keep generated app source separate from Bench runtime.
- Upstream dependency constraints can drift through unpinned transitive packages; record a reproducible manifest and stop on resolver/version conflicts rather than editing upstream metadata.
- Port availability and WSL forwarding can change; recheck before binding each dedicated service.
- Test-company legal name, accounting abbreviation, legal registration/TIN, actual fiscal-year boundaries, UGX confirmation and final Finance role grants remain unresolved. A later approved disposable company may use an explicit TEST name and confirmed test fiscal dates; no real records or unverified VAT/LED/EFRIS rules will be entered.

**Rollback now:** no installation/database rollback is needed. No site/app/service change exists. The inspected Ubuntu was initially stopped; restoring its lifecycle state would require terminating that distro and is intentionally not done automatically because it could now contain user work. The preflight report can remain as evidence.

**Later rollback:** if the new distro creation is approved but setup fails, stop Finance-owned processes only and preserve diagnostic/version evidence. Do not unregister the distro, delete its VHD, drop a site/database or overwrite a restored site without explicit approval. Backup/restore tests must use a separately named disposable site and prove records/apps/native metadata survive restore; matching code and the protected encryption key are part of recovery.

## Requirements before Phase 1B

Phase 1B requires the installed/tested Finance environment, immutable version manifest, native site/account/report evidence, explicit Finance permissions, independent startup/stop procedure, secret exclusions and a successful disposable backup/restore drill. Phase 1B then owns React login, gateway/session security and COA/GL screens. This Phase 1A preflight implements none of those frontend features or any invoice/stock synchronization.
