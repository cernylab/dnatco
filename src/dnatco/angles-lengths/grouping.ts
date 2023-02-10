import { Bin, Bins } from './bin';
import { M } from '../../util/math';

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

function tryAssignBin(macroBin: Bin, bin: Bin) {
    if (M.fuzzyCompare(macroBin.from, bin.to)) { // From the left?
        macroBin.from = bin.from;
        macroBin.probability += bin.probability;

        return true;
    } else if (M.fuzzyCompare(macroBin.to, bin.from)) { // From the right?
        macroBin.to = bin.to;
        macroBin.probability += bin.probability;

        return true;
    }

    return false;
}

export namespace Grouping {
    export function aggregate(bins: Bins, aggregateProbability: number) {
        if (aggregateProbability >= 1.0 || aggregateProbability <= 0.0)
            throw new Error(`${aggregateProbability} aggregate probability value must be in range 0.0 - 1.0`);

        // Sort the bins by probabilities from max to min
        const sortedBins = [...bins].sort((a, b) => b.probability - a.probability);

        let aggre = 0;
        const useBins = [];
        for (const bin of sortedBins) {
            useBins.push(bin);
            aggre += bin.probability;
            if (aggre >= aggregateProbability)
                break;
        }

        if (useBins.length === 0)
            return []; // Weird, but possible if we get odd data

        // Compactified range of used bins.
        // We assume that bins cannot overlap but share a boundary.
        const macroBins = [{ ...useBins.shift()!, prosco: -1 }];
        while (true) {
            let mb = macroBins[macroBins.length - 1];
            let foundMatch = false;

            do {
                // Try to find a bin to extend the current macroBin.
                // Keep running while we keep finding at least one bin that extends the macroBin
                for (let idx = 0; idx < useBins.length; idx++) {
                    const b = useBins[idx];

                    foundMatch = tryAssignBin(mb, b);
                    if (foundMatch) {
                        useBins.splice(idx, 1);
                        break;
                    }
                }
            } while (foundMatch && useBins.length > 0);

            // No more bins to extend the current macroBin. Make a new macroBin and go again.
            if (useBins.length > 0)
                macroBins.push({ ...useBins.shift()!, prosco: -1 });
            else
                return macroBins;
        }
    }

    /**
     * Simple, but relatively naive approach to calculate a probability range from bins.
     * Guaranteed to work correctly only if the probabilities expressed by bins follows normal distribution
     */
    export function cumulative(bins: Bins, cumulativeProbability: number) {
        if (cumulativeProbability >= 1.0 || cumulativeProbability <= 0.0)
            throw new Error(`${cumulativeProbability} cumulative probability value must be in range 0.0 - 1.0`);

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
