import os
import sys
from pathlib import Path

import frappe

def check():
    apps = frappe.get_installed_apps()
    assert {"frappe", "erpnext", "navapack_finance"}.issubset(apps), apps
    for name in ["Account", "Journal Entry", "GL Entry", "Sales Invoice", "Purchase Invoice", "Payment Entry"]:
        assert frappe.db.exists("DocType", name), name
        frappe.get_meta(name)
    assert frappe.db.exists("Report", "General Ledger")
    assert frappe.__version__ == "16.55.1"
    import erpnext
    assert erpnext.__version__ == "16.53.0"
    print({"site": frappe.local.site, "apps": apps, "accounting_metadata": "PASS"})

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"finance.localhost", "finance-restore.localhost"}:
        raise SystemExit("Specify the primary or disposable restore Finance site.")
    # Bench CLI runs site commands from the sites directory. Frappe's
    # logger also resolves ../logs from cwd, independently of sites_path.
    bench_path = Path("/home/frappe/frappe-bench")
    os.chdir(bench_path / "sites")
    frappe.init(site=sys.argv[1], sites_path=str(bench_path / "sites"))
    try:
        frappe.connect()
        check()
    finally:
        if frappe.db:
            frappe.db.rollback()
        frappe.destroy()
