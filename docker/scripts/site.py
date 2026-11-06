import json, os, pathlib, subprocess, sys
site = "finance.localhost"
restore = "finance-restore.localhost"
def bench(*args):
    subprocess.run(["bench", *args], check=True)
mode = sys.argv[1]
if mode == "init":
    if pathlib.Path("sites", site).exists():
        raise SystemExit("Site already exists; refusing to initialize over existing data.")
    bench("new-site", site, "--db-host", "db", "--db-root-password", os.environ["DB_PASSWORD"],
          "--admin-password", os.environ["ADMIN_PASSWORD"], "--mariadb-user-host-login-scope", "%",
          "--install-app", "erpnext", "--install-app", "navapack_finance")
    bench("--site", site, "enable-scheduler")
elif mode == "restore":
    if pathlib.Path("sites", restore).exists():
        raise SystemExit("Restore site already exists; refusing to overwrite it.")
    folder = pathlib.Path("sites", site, "private", "backups")
    databases = sorted(folder.glob("*-database.sql.gz"), key=lambda p: p.stat().st_mtime)
    if not databases:
        raise SystemExit("No database backup found.")
    db = databases[-1]
    prefix = db.name.removesuffix("-database.sql.gz")
    def matching(suffix):
        p = folder / (prefix + suffix)
        if not p.is_file():
            raise SystemExit(f"Missing matching backup: {p}")
        return str(p.resolve())
    public = matching("-files.tgz")
    private = matching("-private-files.tgz")
    config = json.loads(pathlib.Path(matching("-site_config_backup.json")).read_text())
    bench("new-site", restore, "--db-host", "db", "--db-root-password", os.environ["DB_PASSWORD"],
          "--admin-password", os.environ["ADMIN_PASSWORD"], "--mariadb-user-host-login-scope", "%")
    bench("--site", restore, "restore", str(db.resolve()), "--with-public-files", public,
          "--with-private-files", private, "--db-root-password", os.environ["DB_PASSWORD"])
    # Preserve the new restore site's DB credentials, copying only the encryption key.
    target = pathlib.Path("sites", restore, "site_config.json")
    target_config = json.loads(target.read_text())
    if "encryption_key" in config:
        target_config["encryption_key"] = config["encryption_key"]
        target.write_text(json.dumps(target_config, indent=2))
    bench("--site", restore, "disable-scheduler")
    bench("--site", restore, "list-apps")
else:
    raise SystemExit("Unknown mode")
