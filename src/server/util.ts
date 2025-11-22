import fs from 'fs';

const SingleQuote = "'".charCodeAt(0);
const DoubleQuote = '"'.charCodeAt(0);

export function b64decode(b64: string) {
    return Buffer.from(b64, 'base64');
}

export function checkFilePermissions(path: string, perms: number) {
    try {
        fs.accessSync(path, perms);
        return true;
    } catch (e) {
        return false;
    }
}

export function checkInteger(v: number, range: Partial<{ min: number, max: number }>) {
    if (Math.floor(v) !== v)
        return false;

    if (range.min && v < range.min)
        return false;
    if (range.max && v > range.max)
        return false;

    return true;
}

export function checkShape<T>(v: unknown, checker: T, allowPartial = true): v is T {
    if (typeof v !== 'object')
        return false;

    const tv = v as Record<string, unknown>;

    if (allowPartial) {
        for (const prop in tv) {
            if (checker[prop as keyof T] === undefined)
                return false;

            if (typeof tv[prop] !== typeof checker[prop as keyof T])
                return false;
        }
    } else {
        for (const prop in checker) {
            if (tv[prop] === undefined)
                return false;

            if (typeof tv[prop] !== typeof checker[prop as keyof T])
                return false;
        }
    }

    return true;
}

export function dequote(s: string) {
    if (s.length < 2)
        return s;

    const first = s.charCodeAt(0);
    const last = s.charCodeAt(s.length - 1);

    return (first === SingleQuote || first === DoubleQuote) && last === first
        ? s.substring(1, s.length - 1)
        : s;
}

export function isDirectory(path: string) {
    return fs.statSync(path).isDirectory();
}
