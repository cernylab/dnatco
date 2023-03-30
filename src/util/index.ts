const ZeroChar = '0'.charCodeAt(0);
const NineChar = '9'.charCodeAt(0);
const MinusChar = '-';

const FloatRegex = new RegExp('[0-9eE+.,-]');
const PdbIdRegex = new RegExp('[0-9]{1}[a-zA-Z0-9]{3}');
const ZeroCode = '0'.charCodeAt(0);

export const Utf8Decoder = new TextDecoder('utf-8');

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

const LongHtmlColor = /^#([0-9abcdefABCDEF]){6}$/;
const ShortHtmlColor = /^#([0-9abcdefABCDEF]){3}$/;
export function htmlColorAsNumber(s: string) {
    let r, g, b;
    if (s.match(LongHtmlColor)) {
        r = parseInt(s.substring(1, 3), 16);
        g = parseInt(s.substring(3, 5), 16);
        b = parseInt(s.substring(5, 7), 16);
    } else if (s.match(ShortHtmlColor)) {
        r = parseInt(s.substring(1, 2), 16);
        g = parseInt(s.substring(2, 3), 16);
        b = parseInt(s.substring(3, 4), 16);
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

export function isPdbId(v: string) {
    return v.length === 4 && PdbIdRegex.test(v);
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
