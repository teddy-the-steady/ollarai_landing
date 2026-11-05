// Source filings of a result table, from ResultTable.sources (backend pipeline/result_sources.py):
// { filings: { id: { source: dart | edgar, company, company_names?, report, kind, period_end, filed, url } },
//   rows: [[{ filing, role: reported | comparative | derived, statements }], ...] } - rows line up with result.rows.

const ROLE_ORDER = { reported: 0, comparative: 1, derived: 2 };
const SYSTEM = { dart: 'DART', edgar: 'SEC EDGAR' };

export function filingCompany(filing, lang) {
    const names = filing.company_names;
    return (lang === 'ko' ? names?.ko : names?.en) ?? names?.en ?? filing.company ?? '';
}

export function filingLabel(filing, lang) {
    const company = filingCompany(filing, lang);
    return company ? `${company} · ${filing.report}` : filing.report;
}

// The filings of row i, the period's own report first; [] when it has none
export function rowFilings(sources, i) {
    const refs = sources?.rows?.[i] || [];
    return refs
        .filter(ref => sources.filings?.[ref.filing])
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
}

// Every filing of the shown rows, once, with the roles it plays: [{ id, filing, roles: Set }]
export function tableFilings(sources, rowCount) {
    const byId = new Map();
    for (let i = 0; i < rowCount; i++) {
        for (const ref of rowFilings(sources, i)) {
            if (!byId.has(ref.filing)) byId.set(ref.filing, { id: ref.filing, filing: sources.filings[ref.filing], roles: new Set() });
            byId.get(ref.filing).roles.add(ref.role);
        }
    }
    const best = (entry) => Math.min(...[...entry.roles].map(r => ROLE_ORDER[r] ?? 9));
    return [...byId.values()].sort((a, b) => best(a) - best(b)
        || filingCompany(a.filing, 'en').localeCompare(filingCompany(b.filing, 'en'))
        || String(b.filing.period_end || '').localeCompare(String(a.filing.period_end || '')));
}

export const systemName = (filing) => SYSTEM[filing.source] ?? filing.source;
