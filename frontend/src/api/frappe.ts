import type { FinanceProvider, FinanceSnapshot } from './types';
// Native resource routes for a FUTURE server-side adapter. No transport, credentials,
// operational imports, or automatic fallback to sample data exist in this module.
export const nativeResources = Object.freeze({accounts: '/api/resource/Account', ledger: '/api/resource/GL%20Entry', journals: '/api/resource/Journal%20Entry', receivables: '/api/resource/Sales%20Invoice', payables: '/api/resource/Purchase%20Invoice', banking: '/api/resource/Bank%20Transaction', payments: '/api/resource/Payment%20Entry', taxes: '/api/resource/Sales%20Taxes%20and%20Charges%20Template', company: '/api/resource/Company', reports: '/api/method/frappe.desk.query_report.run'});
export class FrappeProvider implements FinanceProvider {
  readonly mode = 'frappe' as const;
  async load(): Promise<FinanceSnapshot> { throw new Error('Finance authentication pending. Secure server-side handoff and native Frappe permissions are required.'); }
}
