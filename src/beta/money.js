// KRW / USD view of a result table's amounts, from ResultTable.money
// (ollarai_backend US_DATA_INTEGRATION_PLAN.md 6장, service_pipeline/pipeline/money_metadata.py).
//
// converted: true  - the server summed / ranked / compared the amount across companies
//                    in won at each statement's rates: KRW as is, USD = value / statement_usd_rates[i][kind]
// converted: false - the amount is in row_currency[i], shown at current_rates (newest ECOS day)
// "MIXED" / null currency, or a currency / statement with no rate: left as is.

export const VIEW_CURRENCIES = ['KRW', 'USD'];

// { value, currency } of an amount cell in `view` - `currency` is still the original one when it
// couldn't be converted (null: unknown, 'MIXED': a sum across currencies). null when not an amount.
export function moneyCell(value, column, rowIndex, money, view) {
    const col = money?.columns?.[column];
    if (!col || typeof value !== 'number') return null;
    if (col.converted) {
        if (view === 'KRW') return { value, currency: 'KRW' };
        const rate = money.statement_usd_rates?.[rowIndex]?.[col.kind];
        return rate ? { value: value / rate, currency: 'USD' } : { value, currency: 'KRW' };
    }
    const currency = money.row_currency?.[rowIndex] ?? null;
    if (!currency || currency === 'MIXED' || currency === view) return { value, currency };
    const krwPerUnit = money.current_rates?.krw_per_unit || {};
    const krw = currency === 'KRW' ? value : krwPerUnit[currency] ? value * krwPerUnit[currency] : null;
    if (krw === null) return { value, currency };
    if (view === 'KRW') return { value: krw, currency: 'KRW' };
    return krwPerUnit.USD ? { value: krw / krwPerUnit.USD, currency: 'USD' } : { value, currency };
}

// The toggle only shows when switching changes at least one cell
export function hasToggle(result) {
    const money = result.money;
    if (!money || !Object.keys(money.columns || {}).length) return false;
    return result.rows.some((row, i) => row.some((value, j) => {
        const krw = moneyCell(value, result.columns[j], i, money, 'KRW');
        const usd = moneyCell(value, result.columns[j], i, money, 'USD');
        return krw?.currency === 'KRW' && usd?.currency === 'USD';
    }));
}
