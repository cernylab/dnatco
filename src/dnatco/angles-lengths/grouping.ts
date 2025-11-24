import { ProScoCommonBottomThreshold } from './';
import { Bin, Bins, isBinValid } from './bin';
import { GlobalConfig } from '../../global-config';

export namespace Grouping {
    function aggregateUnique(bins: Bins, rareBottomThreshold: number) {
        /*

              +---------------------------------------------------------------------+
              |      +      +      +      +      +      +      +      +      +      |
              |                                                                     |
              |                                                                     |
          100 |-+                               ***                               +-|
              |                                 * *                                 |
              |                                 *  *                                |
              |                                *   *                                |
              |                                *    *                               |
              |                               *     *                               |
              |                               *     *                               |
           90 |-+                            *      *                             +-|
              |                              *      *                               |
              |                              *      *                               |
              |                              *       *                              |
              |                              *       *                              |
              |                              *       *                              |
              |                              *       *                              |
           80 |-+                           *         *                           +-|
              |                             *         *                             |
              |                             *         *                             |
              |                             *          *                            |
              |                            *           *                            |
              |                            *           *                            |
              |                            *           *                            |
           70 |-+                          *           *                          +-|
              |                            *           *                            |
              |                            *           *                            |
              |                            *           *                            |
              |                            *           *                            |
              |                            *            *                           |
              |                           *             *                           |
              |                           *             *                           |
           60 |-+                         *             *                         +-|
              |                           *              *                          |
              |                          *               *                          |
              |                          *               *                          |
              |                          *               *                          |
              |                          *               *                          |
              |                          *               *                          |
           50 |-+                        *               *                        +-|
              |                          *               *                          |
              |                          *               *                          |
              |                          *                *                         |
              |                         *                 *                         |
              |                         *                 *                         |
              |                         *                 *                         |
           40 |-+                       *                  *                      +-|
              |                        *                   *                        |
              |                        *                   *                        |
              |                        *                   *                        |
              |                        *                   *                        |
              |                       *                    *                        |
              |                       *                    *                        |
           30 |-+                     *                    *                      +-|
              |                       *                     *                       |
              |                       *                     *                       |
              |                       *                     *                       |
              |                      *                       *                      |
              |                      *                       *                      |
              |                      *                       *                      |
              |                     *                         *                     |
           20 |-+                   *                         *                   +-|
              |                     *                         *                     |
              |                     *                         *                     |
              |                     *                          *                    |
              |                    *                           *                    |
              |                    *                            *                   |
              |                   *                             *                   |
           10 |-+                 *                             *                 +-|
              |                   *                             *                   |
              |                  *                               *                  |
              |                 *                                 *                 |
              |                *                                  *                 |
              |               **                                   **               |
              |      +     ***     +      +      +      +      +     ***     +      |
            0 +---------------------------------------------------------------------+
             -5     -4     -3     -2     -1      0      1      2      3      4      5

                    uuuuuu|rrrr|ccccccccccccccccccccccccccccccccccc|rrrrr|uuuuuu

            The lower "UNIQUE" interval is bracketed by the start of the data and
            the first value that is greater than "RARE BOTTOM THRESHOLD"

            The upper "UNIQUE" interval is bracketed by the end of the data and
            the last value that is less or equal to than "RARE BOTTOM THRESHOLD"
        */

        // Find the lower "UNIQUE" interval
        const lowerUnique: Bin = { prosco: -1, from: -1, to: -1, probability: 0 };
        for (let idx = 0; idx < bins.length; idx++) {
            const bin = bins[idx];

            if (bin.prosco > rareBottomThreshold) break;

            lowerUnique.to = bin.to;
            lowerUnique.probability += bin.probability;
        }
        if (lowerUnique.from === -1) lowerUnique.from = bins[0].from;

        const upperUnique: Bin = { prosco: -1, from: -1, to: -1, probability: 0 };
        for (let idx = bins.length - 1; idx >= 0; idx--) {
            const bin = bins[idx];

            if (bin.prosco > rareBottomThreshold) break;

            upperUnique.from = bin.from;
            upperUnique.probability += bin.probability;
        }
        if (upperUnique.to === -1) upperUnique.to = bins[bins.length - 1].to;

        return { lowerUnique, upperUnique };
    }

    type AmbiguousFinderState = 'finding-beginning' | 'finding-end-candidate' | 'confirming-end-candidate';
    type AmbiguousFinderCtx = {
        beginningIdx: number,
        endCandidateIdx: number,
        state: AmbiguousFinderState,
    };
    function findAmbigious(
        idx: number,
        ctx: AmbiguousFinderCtx,
        bins: Bins,
        rareBottomThreshold: number,
        ambiguous: Bin[],
        searchDir: 'up' | 'down'
    ) {
        const bin = bins[idx];

        if (ctx.state === 'finding-beginning') {
            // Look for the first bin whose ProSco falls below "RARE BOTTOM THRESHOLD"
            if (bin.prosco < rareBottomThreshold) {
                ctx.beginningIdx = idx;
                ctx.state = 'finding-end-candidate';
            }
        } else if (ctx.state === 'finding-end-candidate') {
            // End candidate is a bin whose ProSco is greater that "RARE BOTTOM THRESHOLD"
            if (bin.prosco >= rareBottomThreshold) {
                ctx.endCandidateIdx = idx;
                ctx.state = 'confirming-end-candidate';
            }
        } else if (ctx.state === 'confirming-end-candidate') {
            /* There are two possibilities that can happen with ProSco of the upcoming bins
               1) ProSco falls back below "RARE BOTTOM THRESHOLD"
                  In that case, the "end candidate" is not an end of the "AMBIGUOUS" interval
                  and we need to look further
               2) ProSco exceeds the value of "COMMON BOTTOM THRESHOLD". In this case we have been
                  walking through the "RARE" interval and the "end candidate" is the end of an "AMBIGUOUS" interval
            */

            if (bin.prosco >= ProScoCommonBottomThreshold) {
                if (ctx.beginningIdx > ctx.endCandidateIdx) {
                    let aux = ctx.endCandidateIdx;
                    ctx.endCandidateIdx = ctx.beginningIdx;
                    ctx.beginningIdx = aux;
                }

                let binFrom = bins[ctx.beginningIdx];
                let binTo = bins[ctx.endCandidateIdx];

                // Do not allow "spurious" "AMBIGUOUS" intervals that are just 1 bin wide
                if (ctx.endCandidateIdx - ctx.beginningIdx > 1) {
                    let prob = 0;
                    for (let probIdx = ctx.beginningIdx; probIdx <= ctx.endCandidateIdx; probIdx++) {
                        const _bin = bins[probIdx];
                        prob += _bin.probability;
                    }

                    const ambi = Bin(searchDir === 'up' ? binFrom.from : binFrom.to, binTo.from, prob, -1);
                    ambiguous.push(ambi);
                }

                ctx.state = 'finding-beginning';
            } else if (bin.prosco < rareBottomThreshold) {
                ctx.state = 'finding-end-candidate';
            }
        }
    }
    function aggregateAmbiguous(from: number, to: number, bins: Bins, rareBottomThreshold: number) {
        let fromIdx = 0;
        for (; fromIdx < bins.length; fromIdx++) {
            const bin = bins[fromIdx];
            if (bin.to > from) break;
        }
        let toIdx = bins.length - 1;
        for (; toIdx > fromIdx; toIdx--) {
            const bin = bins[toIdx];
            if (bin.from <= to) break;
        }

        if (fromIdx == toIdx) return [];

        const ambiguous: Bin[] = [];
        const ctx: AmbiguousFinderCtx = {
            beginningIdx: fromIdx,
            endCandidateIdx: -1,
            state: 'finding-end-candidate',
        };
        for (let idx = fromIdx; idx <= toIdx; idx++) {
            findAmbigious(idx, ctx, bins, rareBottomThreshold, ambiguous, 'up');
        }

        ctx.beginningIdx = toIdx;
        ctx.endCandidateIdx = -1;
        ctx.state = 'finding-end-candidate';
        for (let idx = toIdx; idx >= fromIdx; idx--) {
            findAmbigious(idx, ctx, bins, rareBottomThreshold, ambiguous, 'down');
        }

        return ambiguous;
    }

    function aggregateRareAndCommon(bins: Bins, rareBottomThreshold: number) {
        // Find all crossings between "COMMON" and "RARE"

        const crossingsIncr = [];
        const crossingsDecr = [];
        for (let idx = 1; idx < bins.length - 1; idx++) {
            const binL = bins[idx - 1];
            const binU = bins[idx];

            if (binL.prosco < ProScoCommonBottomThreshold && binU.prosco >= ProScoCommonBottomThreshold) crossingsIncr.push(idx);
            else if (binL.prosco >= ProScoCommonBottomThreshold && binU.prosco < ProScoCommonBottomThreshold) crossingsDecr.push(idx);

        }

        const rares = [];
        for (const idx of crossingsIncr) {
            const rare = Bin(-1, bins[idx].from, 0, -1);

            for (let rdx = idx; rdx >= 0; rdx--) {
                const bin = bins[rdx];
                if (bin.prosco < rareBottomThreshold) break;

                rare.from = bin.from;
                rare.probability += bin.probability;
            }

            rares.push(rare);
        }
        for (const idx of crossingsDecr) {
            const rare = Bin(bins[idx].from, -1, 0, -1);

            for (let rdx = idx; rdx < bins.length; rdx++) {
                const bin = bins[rdx];
                if (bin.prosco < rareBottomThreshold) break;

                rare.to = bin.to;
                rare.probability += bin.probability;
            }

            rares.push(rare);
        }

        const commons = [];
        for (const idx of crossingsIncr) {
            const common = Bin(bins[idx].from, -1, 0, -1);

            for (let rdx = idx; rdx < bins.length; rdx++) {
                const bin = bins[rdx];

                if (bin.prosco < ProScoCommonBottomThreshold) break;

                common.to = bin.to;
                common.probability += bin.probability;
            }

            commons.push(common);
        }

        return { rare: rares, common: commons };
    }

    export function aggregate(bins: Bins, rareBottomThreshold: number) {
        const { lowerUnique, upperUnique } = aggregateUnique(bins, rareBottomThreshold);

        const ambiguous = aggregateAmbiguous(
            isBinValid(lowerUnique) ? lowerUnique.to : bins[0].to,
            isBinValid(upperUnique) ? upperUnique.from : bins[bins.length - 1].from,
            bins,
            rareBottomThreshold
        );

        const { rare, common } = aggregateRareAndCommon(bins, rareBottomThreshold);

        if (GlobalConfig.data().anglesLengths.debugProScoGrouping) {
            console.log('L UNIQUE', lowerUnique);
            console.log('U UNIQUE', upperUnique);
            console.log('AMBI', ambiguous);
            console.log('RARE', rare);
            console.log('COMMON', common);
        }

        return {
            lowerUnique,
            upperUnique,
            ambiguous,
            rare,
            common,
        };
    }
}
