import { AnglesLengths } from './';
import { Measurements } from './measurements';
import { Residues } from '../residues';
import { initedArray } from '../../util';

export namespace Summarize {
    export type CountsInGroup = {
        threshold: number,
        exclusive: number,
        cumulative: number,
        pGroupIdx: number|'outlier',
    };

    export type Counts = {
        exclusive: number[],
        cumulative: number[],
    };
    function Counts(nPGroups: number): Counts {
        // +1 for outliers
        return {
            exclusive: initedArray(0, nPGroups + 1),
            cumulative: initedArray(0, nPGroups + 1),
        } as Counts;
    }

    export type Summary = {
        angles: Counts;
        lengths: Counts;
    };

    function count(counts: Counts, nPGroups: number, pgrp?: AnglesLengths.PGroup) {
        let accumulateTo = pgrp ? pgrp.index : nPGroups;
        for (let idx = nPGroups; idx >= accumulateTo; idx--)
            counts.cumulative[idx]++;

        counts.exclusive[pgrp ? pgrp.index : nPGroups]++;
    }

    export function angles(angles: { angle: Measurements.BondAngle, base: Residues.ElementaryResidue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Counts(nPGroups);

        for (const { angle, base } of angles)
            count(counts, nPGroups, AnglesLengths.anglePGroup(base, angle));

        return counts;
    }

    export function lengths(lengths: { length: Measurements.BondLength, base: Residues.ElementaryResidue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Counts(nPGroups);

        for (const { length, base } of lengths)
            count(counts, nPGroups, AnglesLengths.lengthPGroup(base, length));

        return counts;
    }


    export function residue(r: Measurements.Residue): Summary {
        const nPGroups = AnglesLengths.pGroupCount();

        const angles = Counts(nPGroups);
        const lengths = Counts(nPGroups);

        for (const angle of r.bondAngles) {
            const pgrp = AnglesLengths.anglePGroup(r.compound, angle);
            count(angles, nPGroups, pgrp);
        }

        for (const length of r.bondLengths) {
            const pgrp = AnglesLengths.lengthPGroup(r.compound, length);
            count(lengths, nPGroups, pgrp);
        }

        return { angles, lengths };
    }

    export function substructure(residues: Measurements.Residue[]): Summary {
        const nPGroups = AnglesLengths.pGroupCount();

        const angles = Counts(nPGroups);
        const lengths = Counts(nPGroups);

        for (const r of residues) {
            const rs = residue(r);
            for (let idx = 0; idx <= nPGroups; idx++) {
                angles.exclusive[idx] += rs.angles.exclusive[idx];
                angles.cumulative[idx] += rs.angles.cumulative[idx];

                lengths.exclusive[idx] += rs.lengths.exclusive[idx];
                lengths.cumulative[idx] += rs.lengths.cumulative[idx];
            }
        }

        return { angles, lengths };
    }
}
