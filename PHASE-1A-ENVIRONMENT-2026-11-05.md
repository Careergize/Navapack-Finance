# Phase 1A — new Finance distro inspection

5 November 2026. Installation remains pending explicit package approval.

Verified by read-only inspection:

- Distribution `Navapack-Finance`, WSL2, physical disk location `F:/WSL/Navapack-Finance`.
- User `nidhin`, home `/home/nidhin`; user-provided OS output identifies Ubuntu 24.04.5 LTS.
- Linux has Python, Git and curl; no Linux Node, MariaDB, Redis, Bench or uv executable was found in the inspected PATH. npm resolves to the Windows installation and must not be used for Bench.
- Git package `1:2.43.0-1ubuntu7.3`; curl `8.5.0-2ubuntu10.13`.
- No Finance/database/cache listener found; Linux TCP listeners are DNS only at inspection.
- WSL reports 7.4 GiB memory, about 7.0 GiB available and 2 GiB swap. Sparse root filesystem size is virtual; physical storage is correctly on F:.
- Standard systemd services are running. No existing MariaDB/Redis installation/service was found to preserve within this new distro.
- `sudo -n true` reports that interactive sudo authentication is required. No password was requested through chat, captured or supplied.
- The Z: mount warning persists but does not prevent Linux commands. No mount settings were changed.

Proposed first privileged batch, not executed:

```bash
cd /home/nidhin
sudo apt-get update
sudo apt-get --simulate --no-upgrade install build-essential pkg-config libffi-dev libssl-dev
```

The approval requested now covers refreshing package indexes and simulating this dependency install only. The simulation allows review of package candidates, dependency upgrades/removals, disk requirements and service effects before approving actual installation. It creates no Finance database/site, installs no packages, and changes no package repository definitions. Existing package indexes do not yet expose candidates for all future database/cache dependencies, so exact MariaDB/Redis package pins remain unresolved.

Do not run `apt upgrade`, install Ubuntu's default MariaDB or use Windows npm. After the simulation, review the result and obtain approval for the exact installation/repository/service commands. Future Bench path is `/home/nidhin/navapack-finance/navapack-bench`; it has not been created.
