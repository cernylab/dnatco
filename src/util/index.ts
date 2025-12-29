import { clone as _justClone } from './just-clone';
import { GlobalConfig } from '../global-config';

const ZeroChar = '0'.charCodeAt(0);
const NineChar = '9'.charCodeAt(0);
const MinusChar = '-';

const FloatRegex = new RegExp('[0-9eE+.,-]');
// Legacy: 4 characters (e.g., "100d")
const LegacyPdbIdRegex = new RegExp('^[1-9]{1}[a-zA-Z0-9]{3}$');
// Extended 8-char: 8 alphanumeric characters (e.g., "0000100d", "12345678")
const Extended8CharRegex = new RegExp('^[0-9a-zA-Z]{8}$');
// Extended 12-char: pdb_ prefix + 8 characters (e.g., "pdb_0000100d", "pdb_12345678")
const Extended12CharRegex = new RegExp('^[pP][dD][bB]_[0-9a-zA-Z]{8}$');
// Loose: accepts any of the above formats
const ExtendedPdbIdLooseRegex = new RegExp('^(([pP][dD][bB]_)?[0-9a-zA-Z]{8}|[1-9]{1}[a-zA-Z0-9]{3})$');
const ExtendedPdbIdStrictRegex = Extended12CharRegex;
const ZeroCode = '0'.charCodeAt(0);

export const Utf8Decoder = new TextDecoder('utf-8');
// NOTE: U+00C5 is not the correct Unicode code point for the Angstrom sign, that would be U+212B.
// U+00C5 is the swedish capital A with a ring above it. Finding a font that would have the correct
// glyph for Angstrom is difficult so let us stick with the swedish Å.
export const AngstromSignChar = '\u00C5';

export function arraysAreSame<T>(a: Array<T>, b: Array<T>) {
    if (a.length !== b.length)
        return false;
    for (let idx = 0; idx < a.length; idx++) {
        if (a[idx] !== b[idx])
            return false;
    }

    return true;
}

export function capitalize(s: string) {
    return s.substring(0, 1).toUpperCase() + s.substring(1);
}

export function clamp(v: number, min: number, max: number) {
    return v < min ? min :
        v > max ? max : v;
}

export function copyString(s: string) {
    // NOTE: This feels super sketchy but StackOverflow offers a couple
    // of very odd suggestions, all of which are reported to have issues
    return '' + s;
}

export function deepCopy<T>(obj: T): T {
    return _justClone(obj);
}

export function dequote(s: string) {
    const last = s.length - 1;

    if (last < 1)
        return s;

    if ((s[0] === '\'' && s[last] === '\'') || (s[0] === '"' && s[last] === '"'))
        return s.slice(1, s.length - 1);
    return s;
}

export function fileSuffixes(name: string): string[] {
    return name.toLowerCase().split('.').slice(1);
}

export function filterObject<K extends string, RK extends K>(obj: Partial<Record<K, any>>, keep: RK[]): Record<RK, any> {
    const filtered = {};
    for (const rk of keep)
        (filtered as Record<RK, any>)[rk] = obj[rk];

    return filtered as Record<RK, any>;
}

const LongHtmlColor = /^#([0-9abcdefABCDEF]){6}$/;
const ShortHtmlColor = /^#([0-9abcdefABCDEF]){3}$/;
export function htmlColorAsNumber(s: string) {
    let r, g, b;
    if (s.match(LongHtmlColor)) {
        r = parseInt(s.substring(1, 3), 16);
        g = parseInt(s.substring(3, 5), 16);
        b = parseInt(s.substring(5, 7), 16);
    } else if (s.match(ShortHtmlColor)) {
        r = parseInt(s.substring(1, 2), 16) * 16;
        g = parseInt(s.substring(2, 3), 16) * 16;
        b = parseInt(s.substring(3, 4), 16) * 16;
    } else
        return void 0;

    return (r << 16) + (g << 8) + b;
}

export function inWorker() {
    // @ts-ignore
    return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);
}

export function isDigit(s: string) {
    const diff = ZeroCode - s.charCodeAt(0);
    return diff >= 0 && diff <= 9;
}

export function objKeys<T extends Record<K, any>, K extends string>(obj: T, exclude: (keyof T)[] = []): (keyof T)[] {
    const keys = new Array<keyof T>();
    for (const k in obj) {
        if (!exclude.includes(k))
            keys.push(k);
    }

    return keys;
}

export function initedArray<T>(initialValue: T, length: number) {
    const arr = new Array<T>(length);
    for (let idx = 0; idx < length; idx++) arr[idx] = initialValue;

    return arr;
}

export type Interval = { from: number, to: number };
export function Interval(from: number, to: number): Interval {
    return { from, to };
}
export function isWithin(value: number, intvl: Interval) {
    return intvl.from <= value && value <= intvl.to;
}
export function isWithinTri(value: number, intvl: Interval) {
    if (intvl.from <= value && value <= intvl.to)
        return 0; // Inside
    if (value < intvl.from)
        return -1; // Below
    return 1; // Above
}

export function isLegacyPdbId(v: string) {
    return LegacyPdbIdRegex.test(v);
}

export function isExtended8CharPdbId(v: string) {
    return Extended8CharRegex.test(v);
}

export function isPdbId(v: string, loose = false) {
    return loose
        ? ExtendedPdbIdLooseRegex.test(v)
        : LegacyPdbIdRegex.test(v) || ExtendedPdbIdStrictRegex.test(v);
}

export function keyValue<T extends object, K extends keyof T>(obj: T, key: K): [K, T[K]] {
    return [key, obj[key]];
}
export function iterate<T extends object>(obj: T) {
    const list = [];

    for (const p in obj) {
        const kv = keyValue(obj, p);
        list.push(kv);
    }

    return list;
}

export function navPath(location: { hash: string, pathname: string }) {
    if (GlobalConfig.data().useHashRouter) {
        const path = location.hash;
        const idx = path.indexOf('#');
        return path.substring(idx + 1);
    }

    return location.pathname;
}

export function parseIntStrict(obj: unknown, allowNegative = true) {
    if (typeof obj === 'number')
        return obj;
    if (typeof obj !== 'string')
        return NaN;

    const s = obj.trim();

    let idx = 0;
    if (s[0] === MinusChar) {
        if (!allowNegative)
            return NaN;
        idx++;
    }
    for (; idx < s.length; idx++) {
        const code = s.charCodeAt(idx);
        if (code < ZeroChar || code > NineChar)
            return NaN;
    }

    return parseInt(s);
}

export function parseFloatStrict(obj: unknown) {
    if (typeof obj === 'number')
        return obj;
    if (typeof obj !== 'string')
        return NaN;

    const s = obj.trim();
    if (!FloatRegex.test(s))
        return NaN;
    return parseFloat(s);
}

export function replaceAll(s: string, what: string, _with: string) {
    let _s = s;
    while (_s.indexOf(what) !== -1)
        _s = _s.replace(what, _with);

    return _s;
}

export function reverseSequence(from: number, to: number) {
    const seq = new Array<number>();

    for (let idx = from; idx >= to; idx--)
        seq.push(idx);

    return seq;
}

export function sequence(from: number, to: number) {
    const seq = new Array<number>();

    for (let idx = from; idx <= to; idx++)
        seq.push(idx);

    return seq;
}

export async function sleep(msec: number) {
    await new Promise(() => setTimeout(() => {}, msec));
}

export function stringAsCharArray(s: string): string[] {
    return s.length === 0 ? [] : s.split('');
}

export function toFixed(num: number, decimals: number, prefix?: { char: string, length: number }) {
    if (!prefix)
        return num.toFixed(decimals);
    else {
        if (num < 0 && isDigit(prefix.char))
            return "-" + Math.abs(num).toFixed(decimals).padStart(prefix.length - 1, prefix.char);
        else
            return num.toFixed(decimals).padStart(prefix.length, prefix.char);
    }
}

export function toPdbId(v: string) {
    if (!isPdbId(v, true))
        throw new Error(`String "${v}" cannot be converted to a valid PDB ID`);

    const normalized = v.toLowerCase();

    // Legacy 4-char format (e.g., "100d")
    if (isLegacyPdbId(normalized)) {
        return 'pdb_0000' + normalized;
    }

    // Already in 12-char format with pdb_ prefix
    if (normalized.startsWith('pdb_')) {
        return normalized;
    }

    // 8-char format without prefix (e.g., "12345678")
    if (normalized.length === 8) {
        return 'pdb_' + normalized;
    }

    throw new Error(`Unexpected PDB ID format: "${v}"`);
}

/**
 * Decomposes a normalized PDB ID (pdb_xxxxxxxx format) into its path components
 * @param pdbId - Normalized PDB ID in format pdb_xxxxxxxx (e.g., "pdb_0000100d", "pdb_12345678")
 * @returns Object containing:
 *   - prefix: First 4 chars of the 8-char code (e.g., "0000", "1234")
 *   - subdir: Characters at positions 6-7 of the 8-char code (e.g., "00", "67")
 *   - code8: The full 8-character code without pdb_ prefix (e.g., "0000100d", "12345678")
 *   - code4: Last 4 chars of the 8-char code (e.g., "100d", "5678")
 *   - full: The full normalized ID with pdb_ prefix (e.g., "pdb_0000100d", "pdb_12345678")
 */
export function decomposePdbId(pdbId: string) {
    const normalized = pdbId.toLowerCase();

    if (!normalized.startsWith('pdb_') || normalized.length !== 12) {
        throw new Error(`Expected normalized PDB ID in format pdb_xxxxxxxx, got: "${pdbId}"`);
    }

    const code8 = normalized.substring(4); // Remove "pdb_" prefix
    const prefix = code8.substring(0, 4); // First 4 chars: "0000" or "1234"
    const subdir = code8.substring(5, 7); // Chars 6-7: "00" or "67"
    const code4 = code8.substring(4, 8); // Last 4 chars: "100d" or "5678"

    return {
        prefix,
        subdir,
        code8,
        code4,
        full: normalized
    };
}
