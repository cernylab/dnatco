import { parseFloatStrict, parseIntStrict } from './';
import { AnyObject } from './types';

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
            console.log(`No property ${prop} on object`);
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

export function fromTemplate<T>(o: AnyObject, template: T): T|undefined {
    if (!isObj(template)) {
        // Template is a built-in type
        if (typeof template === 'number' && !isNum(o))
            return undefined;
        else if (typeof template === 'string' && !isStr(o))
            return undefined;
        else if (typeof template === 'boolean' && !isBool(o))
            return undefined;
        else if (typeof template === 'function' || typeof template === 'symbol')
            return undefined; // These types cannot appear in data objects

        return o as T;
    } else {
        // Template is an object
        if (Array.isArray(template)) {
            const to = template[0]; // Our template must have at least one element to detect array type
            for (const item of (o as unknown as Array<any>)) {
                const res = fromTemplate(item, to[0]);
                if (!res)
                    return undefined;
            }
            return o as T;
        } else {
            if (!checkProps(o, template))
                return undefined;

            for (const p in template) {
                if (fromTemplate(o[p] as AnyObject, template[p]) === undefined)
                    return undefined;
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
    return typeof obj === 'object' &&
                  obj !== null &&
                  !Array.isArray(obj);
}

export function isStr(obj: unknown): obj is string {
    return typeof obj === 'string';
}