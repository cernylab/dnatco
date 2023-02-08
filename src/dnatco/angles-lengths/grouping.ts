import { Bin, Bins } from './bin';

function pivotIndex(bins: Bins) {
    let max = Number.MIN_VALUE;
    let candidate = -1;

    for (let idx = 0; idx < bins.length; idx++) {
        const p = bins[idx].probability;
        if (p > max) {
            max = p;
            candidate = idx;
        }
    }

    return candidate;
}

export namespace Grouping {
    export function cumulative(bins: Bins, cumulativeProbability: number) {
        if (cumulativeProbability >= 1.0 || cumulativeProbability <= 0.0)
            throw new Error(`{cumulativeProbability} cumulative probability value must be in range 0.0 - 1.0`);

        const pivotIdx = pivotIndex(bins);

        let accumulated = bins[pivotIdx].probability;
        let lowerIdx = pivotIdx;
        let upperIdx = pivotIdx;
        while (accumulated < cumulativeProbability) {
            if (lowerIdx > 0) {
                lowerIdx--;
                accumulated += bins[lowerIdx].probability;
            }

            if (upperIdx < bins.length - 1) {
                upperIdx++;
                accumulated += bins[upperIdx].probability;
            }
        }

        // TODO: What do we do with Prosco value?
        return Bin(bins[lowerIdx].from, bins[upperIdx].to, accumulated, -1);
    }
}
