import { AnglesLengths } from './';
import { Measurements } from './measurements';
import { initedArray } from '../../util';

export namespace Summarize {
    export type Summary = {
        angles: number[],
        lengths: number[],
    }

    export function residue(r: Measurements.Residue): Summary {
        const nIntervals = AnglesLengths.intervalCount();

        // +1 for outliers
        const angles = initedArray(0, nIntervals + 1);
        const lengths = initedArray(0, nIntervals + 1);

        for (const angle of r.bondAngles) {
            const intvl = AnglesLengths.angleInterval(r.compound, angle);
            if (!intvl)
                angles[nIntervals]++;
            else
                angles[intvl.index]++;
        }

        for (const length of r.bondLengths) {
            const intvl = AnglesLengths.lengthInterval(r.compound, length);
            if (!intvl)
                lengths[nIntervals]++;
            else
                lengths[intvl.index]++;
        }

        return { angles, lengths };
    }

    export function substructure(residues: Measurements.Residue[]): Summary {
        const nIntervals = AnglesLengths.intervalCount();

        // +1 for outliers
        const angles = initedArray(0, nIntervals + 1);
        const lengths = initedArray(0, nIntervals + 1);

        for (const r of residues) {
            const rs = residue(r);
            for (let idx = 0; idx <= nIntervals; idx++) {
                angles[idx] += rs.angles[idx];
                lengths[idx] += rs.lengths[idx];
            }
        }

        return { angles, lengths };
    }
}
