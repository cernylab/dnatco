import { fromTemplate, isObj } from '../../util/json';

export const _Naval = {
    weightedMedian: -1,
    scaleFactorLower: -1,
    scaleFactorUpper: -1,
    ofConcernLower: -1,
    ofConcernUpper: -1,
}
export type Naval = typeof _Naval;
export function Naval(
    weightedMedian: number,
    scaleFactorLower: number,
    scaleFactorUpper: number,
    ofConcernLower: number,
    ofConcernUpper: number
): Naval {
    return {
        weightedMedian,
        scaleFactorLower,
        scaleFactorUpper,
        ofConcernLower,
        ofConcernUpper
    };
}

export const _ZPrime = {
    zprime: _Naval
};
export type ZPrime = typeof _ZPrime;

export function isNavalZPrime(v: unknown) : v is Naval {
    if (!isObj(v))
        return false;

    const n = fromTemplate(v, _ZPrime);
    if (n) {
        const z = n.zprime;

        return (
            z.weightedMedian > 0 &&
            z.ofConcernLower < z.ofConcernUpper &&
            z.ofConcernLower > 0 &&
            z.scaleFactorLower > 0
        );
    } else
        return false;
}
