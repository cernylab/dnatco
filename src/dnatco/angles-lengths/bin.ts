import { fromTemplate, isObj } from '../../util/json';

export const _Bin = {
    from: -1,
    to: -1,
    probability: -1,
    prosco: -1,
};
export type Bin = typeof _Bin;
export function Bin(from: number, to: number, probability: number, prosco: number): Bin {
    return { from, to, probability, prosco };
}

export function isWithin(value: number, bin: Bin) {
    return bin.from <= value && value <= bin.to;
}

export type Bins = Bin[];

export const WireBins = {
    from: [] as number[],
    to: [] as number[],
    binprob: [] as number[],
    prosco: [] as number[],
};
export type WireBins = typeof WireBins;
export function isWireBins(v: unknown): v is WireBins {
    if (!isObj(v))
        return false;

    const w = fromTemplate(v, WireBins);
    if (w) {
        return (
            (w.from.length === w.to.length) &&
            (w.from.length === w.binprob.length) &&
            (w.from.length === w.prosco.length)
        );
    } else
        return false;
}

export function toBins(wireBins: WireBins) {
    const bins = [];
    for (let idx = 0; idx < wireBins.from.length; idx++) {
        bins.push(Bin(wireBins.from[idx], wireBins.to[idx], wireBins.binprob[idx], wireBins.prosco[idx]));
    }

    return bins;
}
