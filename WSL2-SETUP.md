# Windows + WSL2 development runbook

**Proposed commands only. Nothing here was executed during Phase 0.** Installation, database/site creation and application generation start only after approval. Run in a dedicated Finance environment. Stop if an existing service would be upgraded or overwritten.

## 1. Windows inspection and WSL

PowerShell, initially read-only:

```powershell
wsl --status
wsl --list --verbose
wsl --list --online
Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

If Ubuntu 24.04 is not installed, use an Administrator PowerShell after approval:

```powershell
wsl --install -d Ubuntu-24.04
```

Restart if requested, initialize a Linux user, and verify version 2. If an existing distribution is already suitable, reuse it only if its services can remain isolated. Do not reinitialize or unregister an existing distro. [Microsoft WSL installation](https://learn.microsoft.com/en-us/windows/wsl/install).

```powershell
wsl --set-version Ubuntu-24.04 2
wsl -d Ubuntu-24.04
```

The remaining commands are **Bash inside WSL**, except the final frontend section. Use `~/navapack-finance`, not `/mnt/f/WORK/ERP`, for Bench. The Windows `finance/` folder holds this plan and proposed tracked infrastructure; the generated app repository will live in WSL. Do not maintain two independently edited custom app copies.

## 2. Isolated prerequisites

Check host and services before installing:

```bash
cat /etc/os-release
uname -a
ss -ltn
command -v python3 node mariadb redis-server bench uv
```

Proposed system packages for the dedicated distro:

```bash
sudo apt update
sudo apt install git curl ca-certificates build-essential pkg-config libffi-dev libssl-dev apt-transport-https redis-server
```

### MariaDB 11.8

Do not assume Ubuntu's default `mariadb-server` is 11.8. Configure the official Community 11.8 repository first. Download its setup script, verify its checksum against the matching release on the official documentation page and inspect it before running:

```bash
mkdir -p ~/navapack-finance/bootstrap
cd ~/navapack-finance/bootstrap
curl -fL https://r.mariadb.com/downloads/mariadb_repo_setup -o mariadb_repo_setup
sha256sum mariadb_repo_setup
less mariadb_repo_setup
```

After the checksum/release review, in a distro without another MariaDB workload:

```bash
sudo bash mariadb_repo_setup --mariadb-server-version=mariadb-11.8 --skip-maxscale
sudo apt update
apt-cache policy mariadb-server
```

Proceed only if the package candidate is the intended 11.8 series:

```bash
sudo apt install mariadb-server mariadb-client libmariadb-dev
sudo service mariadb start
sudo mariadb-secure-installation
mariadb --version
```

Use interactive password prompts and a private password manager. No root passwords in command arguments or shell history. Bench needs a database administration identity authorized to create its dedicated site database; Ubuntu socket-auth-only root may require an explicitly configured local provisioning account. Follow MariaDB administration guidance and the chosen Bench authentication options; never put a guessed password into a script. Do not loosen remote root access. [Official MariaDB repository setup and checksum guidance](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/mariadb-package-repository-setup-and-usage).

Configure Finance MariaDB server character set/collation as `utf8mb4` / `utf8mb4_unicode_ci` in a dedicated include file (proposed `finance/infrastructure/mariadb/finance.cnf` template), keeping service bind localhost/private. Restart only this dedicated instance and verify effective settings. No obsolete MariaDB flags copied from old v13/v14 tutorials. Confirm database/server timezone strategy and use `Africa/Kampala` for Finance posting dates.

### Python, Node and Bench

Follow the current official installation instructions to install reviewed nvm and uv releases. Download installers for review instead of blindly executing remote content. Illustrative commands after approval:

```bash
cd ~/navapack-finance/bootstrap
curl -fL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh -o install-nvm.sh
less install-nvm.sh
bash install-nvm.sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm use 24
npm install -g yarn@1.22.22
curl -fL https://astral.sh/uv/install.sh -o install-uv.sh
less install-uv.sh
sh install-uv.sh
. "$HOME/.local/bin/env"
uv python install 3.14
uv tool install frappe-bench
```

The initial discovery install is not a release lock. Before team reproduction, pin reviewed uv/nvm/Bench patch releases and Python/Node/MariaDB patch versions in the proposed version manifest. For a known approved Bench release use `uv tool install 'frappe-bench==<approved-version>'` with the placeholder replaced. Keep this environment separate from Django and frontend Windows npm.

```bash
uv python find 3.14
node --version
npm --version
yarn --version
redis-server --version
bench --version
```

Expected major versions: Python 3.14, Node 24, Yarn 1.22, MariaDB 11.8, Redis/Valkey 6+. Verify pip in the eventual Bench environment is at least the current guide requirement. PDF rendering uses the selected version's supported renderer; do not install legacy patched Qt/wkhtmltopdf merely from old tutorials. [Current dependency/install guide](https://docs.frappe.io/framework/user/en/installation).

## 3. Generate Bench, site and custom app

Replace these **nonsecret placeholders** with approved stable v16 release tags before running. Frappe and ERPNext patch numbers need not match numerically; select a tested pair. Do not use `develop` or floating branch heads for a reproducible shared environment.

```bash
export FINANCE_FRAPPE_REF='REPLACE_WITH_APPROVED_V16_FRAPPE_TAG'
export FINANCE_ERPNEXT_REF='REPLACE_WITH_APPROVED_V16_ERPNEXT_TAG'
cd ~/navapack-finance
bench init bench --frappe-branch "$FINANCE_FRAPPE_REF" --python "$(uv python find 3.14)"
cd bench
bench get-app --branch "$FINANCE_ERPNEXT_REF" https://github.com/frappe/erpnext
bench new-site --help
bench new-site finance.localhost --db-type mariadb
bench --site finance.localhost install-app erpnext
bench new-app navapack_finance
bench --site finance.localhost install-app navapack_finance
bench --site finance.localhost set-config developer_mode 1
bench use finance.localhost
```

Site creation prompts for database administration credentials and a unique Administrator password; neither belongs in this document, environment examples, terminal logs or Git. If the selected Bench requires an explicit provisioning username, use the documented option shown by `new-site --help`. App generation prompts for metadata/license; use approved Navapack organization details. Do not create a React frontend inside the custom app.

Inspect generated files before adding the proposed `api`, `permissions`, fixture and test files. Set `required_apps = ["erpnext"]` in custom hooks and v16 dependency metadata using the generated template's supported convention. The app's module folder and its JSON/controllers must be generated through Frappe conventions, not through Django migrations. [App generation concepts](https://docs.frappe.io/framework/user/en/basics/apps), [Bench creation command implementation](https://raw.githubusercontent.com/frappe/bench/develop/bench/commands/make.py).

## 4. Ports, processes and private runtime files

Reserve 8002 for Finance HTTP so Django can retain 8000. Bench-generated Redis and socket ports must also be checked; merely changing HTTP does not eliminate collisions. On a dedicated clean distro, retain Bench's generated cache/queue ports if free. If occupied, assign separate ports in Bench common config and regenerate Redis/Procfile via the selected Bench CLI before starting. Never terminate another project's Redis to free a port.

```bash
cd ~/navapack-finance/bench
bench set-config -g webserver_port 8002
bench setup procfile
bench --site finance.localhost migrate
bench build --app navapack_finance
bench --site finance.localhost list-apps
bench version
git -C apps/frappe rev-parse HEAD
git -C apps/erpnext rev-parse HEAD
./env/bin/python --version
./env/bin/python -m pip --version
bench start
```

Review the generated Procfile to ensure the web command uses 8002 and cache/queue/socket ports are isolated. `bench start` runs the web process plus required workers/scheduler/socket/cache services. Do not run only `bench serve` and then conclude asynchronous reports or scheduled jobs work. Commands/options should be checked against the pinned Bench release. [Bench command reference](https://docs.frappe.io/framework/user/en/bench/bench-commands), [Frappe command reference](https://docs.frappe.io/framework/user/en/bench/frappe-commands).

Use the dedicated site `finance.localhost`; verify browser resolution and WSL localhost forwarding. Configure the proxy to pass this site Host rather than accepting an arbitrary browser-selected Frappe site. Developer mode stays disabled in production.

Protect `sites/*/site_config.json`, common site config, database backups, encryption keys, private files, logs and `env/`. They are runtime state, not custom app repository content. Back up the encryption key securely with encrypted site backups, test restore separately, and record nonsecret versions only. Do not commit a whole Bench or run an indiscriminate `git add .` from it.

## 5. Frontend development wiring — proposed after implementation

The approved change to `frontend/vite.config.ts` adds a prefix-specific proxy. This is a design example to implement/test later, not an existing configuration:

```ts
server: {
  port: 5173,
  proxy: {
    '/finance-api': {
      target: 'http://finance.localhost:8002',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/finance-api/, ''),
      cookieDomainRewrite: '',
      cookiePathRewrite: '/finance-api',
    },
  },
}
```

Verify actual Host, Origin/CSRF behavior and cookie rewriting on the pinned Vite/Frappe stack. If Windows cannot resolve that host, use a localhost target with an explicit reviewed upstream site Host strategy; do not disable site or CSRF security. Production needs equivalent TLS edge behavior and an allowlist; the Vite development proxy is not production infrastructure.

Public configuration examples only:

```dotenv
VITE_FINANCE_ENABLED=false
VITE_FINANCE_API_BASE=/finance-api
```

Finance HTTP calls then use `/finance-api/api/resource/Account` and the corresponding native auth/report paths. Existing operations `VITE_API_BASE_URL` remains unchanged. Enable the feature in development only after adding the route/guard/proxy implementation. There is no need to point Django at MariaDB.

Windows PowerShell, **after approved frontend changes**, using the existing installation where available:

```powershell
Set-Location F:\WORK\ERP\frontend
node --version
npm --version
npm run dev
```

If dependencies are absent or an approved lockfile changes, run `npm ci` as a separate approved implementation step. Open `/finance/erpnext/login`; `/finance/login` remains the legacy Django login during coexistence.

## 6. Production preparation is a separate gate

Before deployment, prepare `finance/infrastructure/gateway/nginx.conf`, version/secret example templates and a pinned custom-image deployment using official Frappe tooling or a reviewed managed deployment. Include workers, scheduler, queue/cache, MariaDB backups, private-file retention, HTTPS, health checks, audit logs and restore drills. Configure exact upstream Host, Finance cookie paths, CSRF/Origin rules, no-store headers and allowlisted methods/resources before the SPA fallback.

Do not deploy WSL, developer mode or `bench start` as production services. Do not replace the current frontend deployment or Django service as a side effect of Finance setup. No production/database/container commands are executed or authorized by this Phase 0 deliverable alone.
