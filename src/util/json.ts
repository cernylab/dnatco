import { parseFloatStrict, parseIntStrict } from './';
import { AnyObject } from './types';
import { Logger } from '../log/logger';

export interface TypeChecker<V> {
    (v: unknown): v is V;
}

export function assign<T, K extends keyof T>(dst: T, src: AnyObject, prop: K): T {
    dst[prop] = (src as T)[prop];
    return dst;
}

export function assignAll<T>(dst: AnyObject, src: AnyObject, template: T): T {
    for (const prop in template)
        dst = assign(dst as T, src, prop) as AnyObject;

    return dst as T;
}

export function checkProps<T>(checked: unknown, template: T): checked is T {
    if (!isObj(checked))
        return false;
    for (const prop in template) {
        if (!Object.prototype.hasOwnProperty.call(checked, prop)) {
            Logger.log(Logger.Severity.Warning, `No property ${prop} on object`);
            return false;
        }
    }

    return true;
}

export function checkType<V, T, K extends keyof T>(obj: T, prop: K, checker: TypeChecker<V>) {
    if (!isType(obj[prop] as unknown, checker))
        throw new Error(`Property ${String(prop)} has a wrong type`);
}

export function isType<V>(v: unknown, checker: TypeChecker<V>) {
    return checker(v);
}

export function fromTemplate<T>(o: AnyObject, template: T, partials?: Partial<{[k in keyof T]: object}>): T|undefined {
    if (isPrimitive(template)) {
        // Template is a built-in type
        if (typeof template === 'number' && !isNum(o))
            return undefined;
        else if (typeof template === 'string' && !isStr(o))
            return undefined;
        else if (typeof template === 'boolean' && !isBool(o))
            return undefined;
        else if (typeof template === 'function' || typeof template === 'symbol' || typeof template === 'bigint')
            return undefined; // These types cannot appear in data objects

        return o as T;
    } else {
        // Template is an object
        if (Array.isArray(template)) {
            const to = template[0]; // Our template must have at least one element to detect array type
            for (const item of (o as unknown as Array<any>)) {
                if (!to)
                    return o as T; // No template object to check against. Go Maverick and hope that the input is okay.

                const res = fromTemplate(item, to, partials);
                if (!res)
                    return undefined;
            }
            return o as T;
        } else {
            if (partials) {
                for (const p in template) {
                    if (o[p] === undefined)
                        o[p] = template[p]; // WARNING: We should copy here to prevent accidental modifications of the template
                    else if (fromTemplate(o[p] as AnyObject, template[p], partials[p as keyof T]) === undefined)
                        return undefined;
                }
            } else {
                if (!checkProps(o, template))
                    return undefined;

                for (const p in template) {
                    if (fromTemplate(o[p] as AnyObject, template[p], void 0) === undefined)
                        return undefined;
                }
            }

            return o as T;
        }
    }
}

export function isArr<T>(obj: unknown, chk: TypeChecker<T>): obj is T[] {
    if (Array.isArray(obj) === false)
        return false;

    for (const elem of obj as unknown[]) {
        if (chk(elem) === false)
            return false;
    }

    return true;
}

export function isBool(obj: unknown): obj is boolean {
    return typeof obj === 'boolean';
}

export function isInt(obj: unknown): obj is number {
    if (typeof obj === 'number')
        return Number.isInteger(obj);
    if (typeof obj === 'string')
        return !isNaN(parseIntStrict(obj));
    return false;
}

export function isNum(obj: unknown): obj is number {
    if (typeof obj === 'number')
        return Number.isFinite(obj);
    if (typeof obj === 'string')
        return !isNaN(parseFloatStrict(obj));
    return false;
}

export function isObj(obj: unknown): obj is AnyObject {
    const isObjChk = typeof obj === 'object';
    const notNullChk = obj !== null;
    const notArrChk = !Array.isArray(obj);

    return isObjChk && notNullChk && notArrChk;
}

export function isPrimitive(obj: unknown): obj is number|string|boolean|symbol|bigint {
    const notObjChk = typeof obj !== 'object';
    const notNullChk = obj !== null;
    const notArrChk = !Array.isArray(obj);

    return notObjChk && notNullChk && notArrChk;
}

export function isStr(obj: unknown): obj is string {
    return typeof obj === 'string';
}