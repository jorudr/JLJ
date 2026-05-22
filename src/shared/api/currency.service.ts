import { saveToDisk, loadFromDisk } from '../diskStorage';

const CACHE_FILE = 'vault_currency_cache';
const PRIMARY_API = 'https://api.frankfurter.app';
const FALLBACK_API = 'https://open.er-api.com/v6/latest';

interface RateCache {
    [key: string]: {
        rate: number;
        timestamp: number;
    };
}

let vaultCache: RateCache = {};

function normalizeSymbol(symbol: string): string {
    const s = String(symbol || '').toUpperCase();
    if (s === 'USDT' || s === 'USDC') return 'USD';
    return s || 'USD';
}

export function getAssetBaseCurrency(symbol: string, type: string): string {
    const s = String(symbol || '').toUpperCase();
    
    // Forex (EUR/USD -> USD is the quote)
    if (type === 'Forex' && s.includes('/')) {
        return s.split('/')[1] || 'USD';
    }

    // Metals (XAU/USD -> USD)
    if (type === 'Metals' && s.includes('/')) {
        return s.split('/')[1] || 'USD';
    }

    // Stocks
    if (type === 'Stocks') {
        if (s.endsWith('.DE') || s.endsWith('.PA') || s.endsWith('.AS')) return 'EUR';
        if (s.endsWith('.L')) return 'GBP';
        if (s.endsWith('.T')) return 'JPY';
        if (s.endsWith('.HK')) return 'HKD';
        if (s.endsWith('.TW')) return 'TWD';
        if (s.endsWith('.RU')) return 'RUB';
        return 'USD';
    }

    return 'USD';
}

export async function getExchangeRate(from: string, to: string, date?: Date): Promise<number> {
    const f = normalizeSymbol(from);
    const t = normalizeSymbol(to);

    if (f === t) return 1.0;

    const dateStr = date ? date.toISOString().split('T')[0] : 'latest';
    const cacheKey = `${f}_${t}_${dateStr}`;

    // 1. Sync Cache
    if (vaultCache[cacheKey]) return vaultCache[cacheKey].rate;
    const diskCache = await loadFromDisk<RateCache>(CACHE_FILE);
    if (diskCache?.[cacheKey]) {
        vaultCache = { ...vaultCache, ...diskCache };
        return diskCache[cacheKey].rate;
    }

    // 2. Frankfurter (Historical focus)
    if (date) {
        try {
            const url = `${PRIMARY_API}/${dateStr}?from=${f}&to=${t}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.rates?.[t]) {
                const rate = Number(data.rates[t]);
                vaultCache[cacheKey] = { rate, timestamp: Date.now() };
                await saveToDisk(CACHE_FILE, vaultCache);
                return rate;
            }
        } catch (e) {
            console.warn('[Currency] Frankfurter failed', e);
        }
    }

    // 3. ER-API (Live/Broad Global)
    try {
        const url = `${FALLBACK_API}/${f}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.rates?.[t]) {
            const rate = Number(data.rates[t]);
            vaultCache[cacheKey] = { rate, timestamp: Date.now() };
            await saveToDisk(CACHE_FILE, vaultCache);
            return rate;
        }
    } catch (e) {
        console.error('[Currency] ER-API failed', e);
    }

    return 1.0; 
}
