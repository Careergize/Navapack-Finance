# Navapack Finance — Phase 0

Audit date: 4 November 2026 (Asia/Calcutta). Status: **plan awaiting approval; implementation not started**.

This folder contains documentation only. Existing application source was inspected without modification. No packages, databases, migrations, accounts, infrastructure or credentials were created.

Read in order:

1. [Repository audit and architecture plan](PHASE-0-PLAN.md)
2. [Finance screen and native API catalogue](MODULE-API-MAPPING.md)
3. [Windows / WSL2 setup runbook](WSL2-SETUP.md)
4. [Phase 1 checklist and verification gates](PHASE-1-CHECKLIST.md)

Phase 1A status: [environment preflight, verified release candidates and approval gate](PHASE-1A-PREFLIGHT.md). Installation has not started; a separate F:-backed WSL distribution is proposed because the existing Ubuntu disk is on a nearly full C: drive.

Paths in these documents are relative to `F:/WORK/ERP` unless explicitly labelled as WSL paths. Proposed trees are plans, not generated applications. Commands are for execution only after approval.

Key finding: the repository already contains a Django accounting implementation and uses `/finance` and `/finance/login`. Introduce the new application at `/finance/erpnext/*` initially; keep the existing screens and posting behavior intact until an approved ledger cutover. PostgreSQL remains the operations target; use a separate MariaDB database for ERPNext.
