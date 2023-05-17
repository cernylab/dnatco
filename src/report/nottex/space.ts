export type NTUnit = { readonly '@type': 'ntunit' } & number;
export namespace NTUnit {
    export function add(a: NTUnit, b: NTUnit): NTUnit {
        return (a + b) as NTUnit;
    }

    export function asCm(nt: NTUnit) {
        return (nt as number) / 100.0;
    }

    export function asMm(nt: NTUnit) {
        return (nt as number) / 10.0;
    }

    export function create (metric: NTMetric): NTUnit {
        switch (metric.type) {
            case 'ntcentimeter':
                return metric.value * 100.0 as NTUnit;
            case 'ntmillimeter':
                return metric.value * 10.0 as NTUnit;
        }
    }

    export function from(src: NTUnit | NTMetric) {
        return NTMetric.is(src) ? NTUnit.create(src) : src;
    }

    export function isZero(nt: NTUnit) {
        return (nt as number) === 0;
    }

    export function multiply(coefficient: number, nt: NTUnit): NTUnit {
        return (nt as number) * coefficient as NTUnit;
    }

    export function num(nt: NTUnit) {
        return nt as number;
    }

    export function subtract(a: NTUnit, b: NTUnit): NTUnit {
        return (a - b) as NTUnit;
    }

    export function toCm(nt: NTUnit) {
        return NTCm(NTUnit.asCm(nt));
    }

    export function toMm(nt: NTUnit) {
        return NTMm(NTUnit.asMm(nt));
    }

    export function zero() {
        return 0 as NTUnit;
    }
}

export type NTCm = {
    readonly type: 'ntcentimeter',
    value: number,
}
export function NTCm(value: number): NTCm {
    return { type: 'ntcentimeter', value };
}

export type NTMm = {
    readonly type: 'ntmillimeter',
    value: number,
}
export function NTMm(value: number): NTMm {
    return { type: 'ntmillimeter', value };
}

export type NTMetric = NTCm | NTMm;
export namespace NTMetric {
    export function is(v: Record<string, any>): v is NTMetric {
        const t = v['type'];
        if (t === undefined)
            return false;

        return t === 'ntcentimeter' || t === 'ntmillimeter';
    }
}


export type NTXY<T extends number = NTUnit> = {
    x: T,
    y: T,
}
export function NTXY<T extends number = NTUnit>(x: T, y: T): NTXY<T> {
    return { x, y };
}

export type NTWH<T extends number = NTUnit> = {
    width: T,
    height: T,
}

export type NTXYWH<T extends number = NTUnit> = {
    x: T
    y: T,
    width: T,
    height?: T,
}
export namespace NTXYWH {
    export function create(x: NTUnit | NTMetric, y: NTUnit | NTMetric, width: NTUnit | NTMetric, height?: NTUnit | NTMetric): NTXYWH {
        return {
            x: NTUnit.from(x),
            y: NTUnit.from(y),
            width: NTUnit.from(width),
            height: height ? NTUnit.from(height) : void 0,
        };
    }

    export function down<T extends number = NTUnit>(xywh: NTXYWH<T>): T | undefined {
        return xywh.height !== undefined
            ? (xywh.y + xywh.height) as T
            : void 0;
    }

    export function right<T extends number = NTUnit>(xywh: NTXYWH<T>): T {
        return xywh.x + xywh.width as T;
    }
}
