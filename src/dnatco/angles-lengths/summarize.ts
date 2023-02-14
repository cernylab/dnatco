import { AnglesLengths } from './';
import { Measurements } from './measurements';
import { initedArray } from '../../util';

export namespace Summarize {
    export type CountInGroup = {
        threshold: number,
        count: number,
        group: number|'outlier',
    };

    export type Summary = {
        angles: number[],
        lengths: number[],
    };

    export function residue(r: Measurements.Residue): Summary {
        const nGroups = AnglesLengths.pGroupCount();

        // +1 for outliers
        const angles = initedArray(0, nGroups + 1);
        const lengths = initedArray(0, nGroups + 1);

        for (const angle of r.bondAngles) {
            const intvl = AnglesLengths.anglePGroup(r.compound, angle);
            if (!intvl)
                angles[nGroups]++;
            else
                angles[intvl.index]++;
        }

        for (const length of r.bondLengths) {
            const intvl = AnglesLengths.lengthPGroup(r.compound, length);
            if (!intvl)
                lengths[nGroups]++;
            else
                lengths[intvl.index]++;
        }

        return { angles, lengths };
    }

    export function substructure(residues: Measurements.Residue[]): Summary {
        const nGroups = AnglesLengths.pGroupCount();

        // +1 for outliers
        const angles = initedArray(0, nGroups + 1);
        const lengths = initedArray(0, nGroups + 1);

        for (const r of residues) {
            const rs = residue(r);
            for (let idx = 0; idx <= nGroups; idx++) {
                angles[idx] += rs.angles[idx];
                lengths[idx] += rs.lengths[idx];
            }
        }

        return { angles, lengths };
    }
}
