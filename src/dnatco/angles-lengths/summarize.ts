import { AnglesLengths, NavalRankingClass } from './';
import { Measurements } from './measurements';
import { MappedNaval } from '../dnatcofication';
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

function count(counts: Summarize.Counts, nPGroups: number, pgrp?: AnglesLengths.PGroup) {
    let accumulateTo = pgrp ? pgrp.index : nPGroups;
    countWithEnd(counts, accumulateTo, nPGroups);
}

function countWithEnd(counts: Summarize.Counts, accumulateTo: number, max: number) {
    for (let idx = max; idx >= accumulateTo; idx--)
        counts.cumulative[idx]++;

    counts.exclusive[accumulateTo]++;
}

export namespace SummarizeProSco {
    export type CountsInGroup = {
        threshold: number,
        exclusive: number,
        cumulative: number,
        pGroupIdx: number|'outlier',
    };

    export function angles(angles: { angle: Measurements.BondAngle, r: Measurements.Residue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Summarize.Counts(nPGroups);

        for (const { angle, r } of angles)
            count(counts, nPGroups, AnglesLengths.anglePGroup(r.compound, angle));

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

    export function lengths(lengths: { length: Measurements.BondLength, r: Measurements.Residue }[]) {
        const nPGroups = AnglesLengths.pGroupCount();
        const counts = Summarize.Counts(nPGroups);

        for (const { length, r } of lengths)
            count(counts, nPGroups, AnglesLengths.lengthPGroup(r.compound, length));

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
const NavalRankingClassToIndex: Record<NavalRankingClass, number> = {
    'preferred': 0,
    'allowed': 1,
    'of-concern': 2,
};

function rankNavalAngle(naval: MappedNaval, r: Measurements.Residue, angle: Measurements.BondAngle) {
    const ranking = AnglesLengths.angleNavalRanking(r.compound, angle);
    const navalAngle =  AnglesLengths.navalAngle(naval, r, angle.triplet);
    const pgrp = AnglesLengths.anglePGroup(r.compound, angle);

    return AnglesLengths.navalRankingClass(
        angle.angle,
        ranking,
        navalAngle.csdPreferredLeft,
        navalAngle.csdPreferredRight,
        pgrp
    );
}

function rankNavalLength(naval: MappedNaval, r: Measurements.Residue, length: Measurements.BondLength) {
    const ranking = AnglesLengths.lengthNavalRanking(r.compound, length);
    const navalAngle =  AnglesLengths.navalBond(naval, r, length.pair);
    const pgrp = AnglesLengths.lengthPGroup(r.compound, length);

    return AnglesLengths.navalRankingClass(
        length.length,
        ranking,
        navalAngle.csdPreferredLeft,
        navalAngle.csdPreferredRight,
        pgrp
    );
}

export namespace SummarizeNaval {
    export function angles(angles: { angle: Measurements.BondAngle, r: Measurements.Residue }[], naval: MappedNaval) {
        const counts = Summarize.Counts(NavalPGroupCount);

        for (const { angle, r } of angles) {
            const navalRankingClass = rankNavalAngle(naval, r, angle);
            countWithEnd(counts, NavalPGroupCount, NavalRankingClassToIndex[navalRankingClass]);
        }

        return counts;
    }

    export function lengths(lengths: { length: Measurements.BondLength, r: Measurements.Residue }[], naval: MappedNaval) {
        const counts = Summarize.Counts(NavalPGroupCount);

        for (const { length, r } of lengths) {
            const navalRankingClass = rankNavalLength(naval, r, length);
            countWithEnd(counts, NavalPGroupCount, NavalRankingClassToIndex[navalRankingClass]);
        }

        return counts;
    }

    export function residue(r: Measurements.Residue, naval: MappedNaval): Summarize.Summary {
        const angles = Summarize.Counts(NavalPGroupCount);
        const lengths = Summarize.Counts(NavalPGroupCount);

        for (const angle of r.bondAngles) {
            const navalRankingClass = rankNavalAngle(naval, r, angle);
            countWithEnd(angles, NavalPGroupCount, NavalRankingClassToIndex[navalRankingClass]);
        }

        for (const length of r.bondLengths) {
            const navalRankingClass = rankNavalLength(naval, r, length);
            countWithEnd(lengths, NavalPGroupCount, NavalRankingClassToIndex[navalRankingClass]);
        }

        return { angles, lengths };
    }
}
