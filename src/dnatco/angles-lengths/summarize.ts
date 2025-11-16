import { AnglesLengths, ElementaryResidue } from './';
import { Measurements } from './measurements';
import { initedArray } from '../../util';

export namespace Summarize {
    export type Counts = {
        exclusive: number[],
        cumulative: number[],
    };
    export function Counts(nPGroups: number): Counts {
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
}

export namespace SummarizeProSco {
    export type CountsInGroup = {
        threshold: number,
        exclusive: number,
        cumulative: number,
        pGroupIdx: number|'outlier',
    };

    function count(counts: Summarize.Counts, nPGroups: number, pgrp?: AnglesLengths.PGroup) {
        let accumulateTo = pgrp ? pgrp.index : nPGroups;
        for (let idx = nPGroups; idx >= accumulateTo; idx--)
            counts.cumulative[idx]++;

        counts.exclusive[pgrp ? pgrp.index : nPGroups]++;
    }

    export function angles(angles: { angle: Measurements.BondAngle, base: ElementaryResidue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Summarize.Counts(nPGroups);

        for (const { angle, base } of angles)
            count(counts, nPGroups, AnglesLengths.anglePGroup(base, angle));

        return counts;
    }

    export function countsInGroups(counts: Summarize.Counts): CountsInGroup[] {
        const thresholds = AnglesLengths.pGroupThresholds();
        const cig = [];

        for (let idx = 0; idx <= thresholds.length; idx++) {
            const thr = thresholds[idx];
            cig.push({
                threshold: thr ?? 100,
                exclusive: counts.exclusive[idx],
                cumulative: counts.cumulative[idx],
                pGroupIdx: (thr ? idx : 'outlier') as SummarizeProSco.CountsInGroup['pGroupIdx'],
            });
        }

        return cig;
    }

    export function lengths(lengths: { length: Measurements.BondLength, base: ElementaryResidue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Summarize.Counts(nPGroups);

        for (const { length, base } of lengths)
            count(counts, nPGroups, AnglesLengths.lengthPGroup(base, length));

        return counts;
    }

    export function residue(r: Measurements.Residue): Summarize.Summary {
        const nPGroups = AnglesLengths.pGroupCount();

        const angles = Summarize.Counts(nPGroups);
        const lengths = Summarize.Counts(nPGroups);

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

    export function substructure(residues: Measurements.Residue[]): Summarize.Summary {
        const nPGroups = AnglesLengths.pGroupCount();

        const angles = Summarize.Counts(nPGroups);
        const lengths = Summarize.Counts(nPGroups);

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

const NavalPGroupCount = 2; // Preferred, Allowed, OfConcern is outlier
export namespace SummarizeNaval {
    export function angles(angles: { angle: Measurements.BondAngle, base: ElementaryResidue }[]) {
        // TODO: Implement

        return Summarize.Counts(NavalPGroupCount);
    }

    export function lengths(lengths: { length: Measurements.BondLength, base: ElementaryResidue }[]) {
        // TODO: Implement

        return Summarize.Counts(NavalPGroupCount);
    }

    export function residue(r: Measurements.Residue): Summarize.Summary {
        const angles = Summarize.Counts(NavalPGroupCount);
        const lengths = Summarize.Counts(NavalPGroupCount);

        // TODO: Implement

        return { angles, lengths };
    }
}
