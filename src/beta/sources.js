// Source filings of a result table, from ResultTable.sources (backend pipeline/result_sources.py):
// { filings: { id: { source: dart | edgar, company, company_names?, report, kind, period_end, filed, url } },
//   rows: [[{ filing, role: reported | comparative | derived, statements, sections? }], ...] } - rows line up
//   with result.rows. sections: { is | bs | cf: { title, url } } - the statement's own page in the filing
//   (filings whose table of contents was read, FilingSections), else the filing's cover (filing.url).
//   statements may also name what beside the statements a row was read from (TOPICS: R&D, the
//   segment / product / region sales, the shareholder / investment lists) - those open the filing.

const ROLE_ORDER = { reported: 0, comparative: 1, derived: 2 };
const SYSTEM = { dart: 'DART', edgar: 'SEC EDGAR' };
export const STATEMENTS = ['is', 'bs', 'cf'];
export const TOPICS = ['rd', 'seg', 'prod', 'reg', 'sh', 'inv'];

// What of the filing a reference stands for beside the statements (first of TOPICS), or null
export const refTopic = (ref) => TOPICS.find(tp => ref.statements?.includes(tp)) ?? null;

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

// Where a reference opens: the page of the first statement it stands behind (income statement first)
// that the filing has one for, else the filing - { url, statement: 'is' | 'bs' | 'cf' | null }
export function refLink(sources, ref) {
    const statement = STATEMENTS.find(st => ref.statements?.includes(st) && ref.sections?.[st]?.url);
    return statement ? { url: ref.sections[statement].url, statement }
        : { url: sources.filings[ref.filing].url, statement: null };
}

// Every filing of the shown rows, once, with the roles it plays and the statement pages linked:
// [{ id, filing, roles: Set, sections: Map(statement -> { title, url }), topics: Set (of TOPICS) }]
export function tableFilings(sources, rowCount) {
    const byId = new Map();
    for (let i = 0; i < rowCount; i++) {
        for (const ref of rowFilings(sources, i)) {
            if (!byId.has(ref.filing)) {
                byId.set(ref.filing, { id: ref.filing, filing: sources.filings[ref.filing], roles: new Set(),
                    sections: new Map(), topics: new Set() });
            }
            const entry = byId.get(ref.filing);
            entry.roles.add(ref.role);
            for (const tp of ref.statements || []) if (TOPICS.includes(tp)) entry.topics.add(tp);
            for (const [st, section] of Object.entries(ref.sections || {})) {
                if (!entry.sections.has(st)) entry.sections.set(st, section);
            }
        }
    }
    const best = (entry) => Math.min(...[...entry.roles].map(r => ROLE_ORDER[r] ?? 9));
    return [...byId.values()].sort((a, b) => best(a) - best(b)
        || filingCompany(a.filing, 'en').localeCompare(filingCompany(b.filing, 'en'))
        || String(b.filing.period_end || '').localeCompare(String(a.filing.period_end || '')));
}

export const systemName = (filing) => SYSTEM[filing.source] ?? filing.source;
