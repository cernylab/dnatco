import { dequote, parseFloatStrict, parseIntStrict } from '../../util';

const CifDateRegExp = RegExp('[0-9]?[0-9]?[0-9][0-9]-[0-9]?[0-9]-[0-9][0-9]');
const CifTimeRegExp = RegExp('[0-9]?[0-9]?[0-9][0-9]-[0-9]?[0-9](-[0-9]?[0-9])?(:[0-9]?[0-9]:[0-9][0-9])?');

export namespace Schema {
    export type CifDate = { year: number, month: number, day: number };
    export type CifTime = { year: number, month: number, day: number, hour: number, minute: number };

    export type Base           = { mandatory: boolean };
    export type Date           = { cifType: 'date', T: CifDate } & Base;
    export type Enum<T>        = { cifType: 'enum', T: T, options: T[]} & Base;
    export type Float          = { cifType: 'float', T: number } & Base;
    export type Int            = { cifType: 'int', T: number } & Base;
    export type Str            = { cifType: 'str', T: string } & Base;
    export type Time           = { cifType: 'time', T: CifTime } & Base;

    export type CifType<T = any> = Enum<T>|Date|Float|Int|Str|Time;

    export const date: Date                = { cifType: 'date', T: { year: 0, month: 0, day: 0 } , mandatory: false };
    export const float: Float               = { cifType: 'float', T: 0, mandatory: false };
    export const int: Int                   = { cifType: 'int', T: 0, mandatory: false };
    export const str: Str                   = { cifType: 'str', T: '', mandatory: false };
    export const time: Time                = { cifType: 'time', T: { year: 0, month: 0, day: 0, hour: 0, minute: 0 }, mandatory: false };
    export const dateM: Date                = { cifType: 'date', T: { year: 0, month: 0, day: 0 } , mandatory: false };
    export const floatM: Float              = { cifType: 'float', T: 0, mandatory: true, };
    export const intM: Int                  = { cifType: 'int', T: 0, mandatory: true, };
    export const strM: Str                  = { cifType: 'str', T: '', mandatory: true };
    export const timeM: Time                = { cifType: 'time', T: { year: 0, month: 0, day: 0, hour: 0, minute: 0 }, mandatory: true };

    export type Attributes = Partial<{ mandatory: boolean, maybeEmpty: boolean }>;
    export function Enum<T>(options: T[], val = options[0], mandatory = false): Enum<T> { return { cifType: 'enum', T: val, options, mandatory }; }
    export function Float(val = 0, attrs: Attributes = {}): Float { return { cifType: 'float', T: val, mandatory: attrs.mandatory ?? false }; }
    export function Int(val = 0, attrs: Attributes = {}): Int { return { cifType: 'int', T: val, mandatory: attrs.mandatory ?? false }; }
    export function Str(val = '', attrs: Attributes = {}): Str { return { cifType: 'str', T: val, mandatory: attrs.mandatory ?? false }; }

    export function isDate(v :CifType): v is Date { return v.cifType === 'date'; }
    export function isEnum<T>(v: CifType<T>): v is Enum<T> { return v.cifType === 'enum'; }
    export function isFloat(v: CifType): v is Float { return v.cifType === 'float'; }
    export function isInt(v: CifType): v is Int { return v.cifType === 'int'; }
    export function isStr(v: CifType): v is Str { return v.cifType === 'str'; }
    export function isTime(v: CifType): v is Str { return v.cifType === 'time'; }

    export type Row<S> = { [K in keyof S]: string|number|CifDate|CifTime };
    export type Schema<T = any> = Record<string, CifType<T>>;

    export function toDate(v: string): CifDate {
        if (!CifDateRegExp.test(v))
            throw new Error(`Expected a string in standard CIF date format but got ${v}`);
        const toks = v.split('-');
        return {
            year: parseInt(toks[0]),
            month: parseInt(toks[1]),
            day: parseInt(toks[2]),
        };
    }

    export function toEnum<T>(v: string, en: Enum<T>) {
        let dv = v !== null ? dequote(v) : null;

        // Enum might in principle contain anything but what we get from the raw Cif is a string
        // Convert enum options to string for proper comparison
        for (const o of en.options) {
            if (typeof o === 'string') {
                if (o === dv)
                    return o;
            } else {
                const so = (o as any).toString();
                if (so === dv)
                    return o;
            }
        }

        throw new Error(`Expected enum of ${en.options.join(', ')}, got ${v === null ? '<null>' : dv}`);
    }

    export function toFloat(v: string) {
        const num = parseFloatStrict(v);
        if (isNaN(num))
            throw new Error(`Expected float, got ${v}`);
        return num;
    }

    export function toInt(v: string) {
        const num = parseIntStrict(v);
        if (isNaN(num))
            throw new Error(`Expected integer, got ${v}`);
        return num;
    }

    export function toTime(v: string): CifTime {
        if (!CifTimeRegExp.test(v))
            throw new Error(`Expected a string in standard CIF time format but got ${v}`);
        const toksDate = v.split('-');
        const toksTime = toksDate[2].split(':');
        return {
            year: parseInt(toksDate[0]),
            month: parseInt(toksDate[1]),
            day: parseInt(toksTime[0]),
            hour: parseInt(toksTime[1]),
            minute: parseInt(toksTime[2]),
        };
    }

    export function toStr(v: string) {
        return dequote(v);
    }
}

export type Category<S extends Schema.Schema> = {
    name: string;
    schema: S;
}
