import { AnglesLengths, NavalPGroupCount, NavalRankingClass } from './';
import { Measurements } from './measurements';
import { MappedNaval } from '../dnatcofication';
import { initedArray } from '../../util';
import { M } from '../../util/math';

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

function rankNavalAngle(naval: MappedNaval, r: Measurements.Residue, angle: Measurements.BondAngle) {
    const ranking = AnglesLengths.angleNavalRanking(r.compound, angle);
    const navalAngle =  AnglesLengths.navalAngle(naval, r, angle.triplet);
    const pgrp = AnglesLengths.anglePGroup(r.compound, angle);

    const ret = AnglesLengths.navalRankingClass(
        angle.angle,
        ranking,
        M.d2r(navalAngle.csdPreferredLeft),
        M.d2r(navalAngle.csdPreferredRight),
        pgrp
    );

    console.log(ranking, angle.angle, ret);

    return ret;
}

function rankNavalLength(naval: MappedNaval, r: Measurements.Residue, length: Measurements.BondLength) {
    const ranking = AnglesLengths.lengthNavalRanking(r.compound, length);
    const navalBond =  AnglesLengths.navalBond(naval, r, length.pair);
    const pgrp = AnglesLengths.lengthPGroup(r.compound, length);

    return AnglesLengths.navalRankingClass(
        length.length,
        ranking,
        navalBond.csdPreferredLeft,
        navalBond.csdPreferredRight,
        pgrp
    );
}

export namespace SummarizeNaval {
    export type CountsInGroup = {
        exclusive: number,
        cumulative: number,
        class: NavalRankingClass,
    };

    export function angles(angles: { angle: Measurements.BondAngle, r: Measurements.Residue }[], naval: MappedNaval) {
        const counts = Summarize.Counts(NavalPGroupCount);

        for (const { angle, r } of angles) {
            const navalRankingClass = rankNavalAngle(naval, r, angle);
            countWithEnd(counts, AnglesLengths.NavalRankingClassToIndex[navalRankingClass], NavalPGroupCount);
        }

        return counts;
    }

    export function lengths(lengths: { length: Measurements.BondLength, r: Measurements.Residue }[], naval: MappedNaval) {
        const counts = Summarize.Counts(NavalPGroupCount);

        for (const { length, r } of lengths) {
            const navalRankingClass = rankNavalLength(naval, r, length);
            countWithEnd(counts, AnglesLengths.NavalRankingClassToIndex[navalRankingClass], NavalPGroupCount);
        }

        return counts;
    }

    export function countsInGroups(counts: Summarize.Counts): CountsInGroup[] {
        const cig = [];

        for (const cls of ['preferred', 'allowed', 'of-concern'] as const) {
            cig.push({
                exclusive: counts.exclusive[AnglesLengths.NavalRankingClassToIndex[cls]],
                cumulative: counts.cumulative[AnglesLengths.NavalRankingClassToIndex[cls]],
                class: cls,
            });
        }

        return cig;
    }

    export function residue(r: Measurements.Residue, naval: MappedNaval): Summarize.Summary {
        const angles = Summarize.Counts(NavalPGroupCount);
        const lengths = Summarize.Counts(NavalPGroupCount);

        for (const angle of r.bondAngles) {
            const navalRankingClass = rankNavalAngle(naval, r, angle);
            countWithEnd(angles, AnglesLengths.NavalRankingClassToIndex[navalRankingClass], NavalPGroupCount);
        }

        for (const length of r.bondLengths) {
            const navalRankingClass = rankNavalLength(naval, r, length);
            countWithEnd(lengths, AnglesLengths.NavalRankingClassToIndex[navalRankingClass], NavalPGroupCount);
        }

        return { angles, lengths };
    }

    export function substructure(residues: Measurements.Residue[], naval: MappedNaval): Summarize.Summary {
        const angles = Summarize.Counts(NavalPGroupCount);
        const lengths = Summarize.Counts(NavalPGroupCount);

        for (const r of residues) {
            const rs = residue(r, naval);
            for (let idx = 0; idx <= NavalPGroupCount; idx++) {
                angles.exclusive[idx] += rs.angles.exclusive[idx];
                angles.cumulative[idx] += rs.angles.cumulative[idx];

                lengths.exclusive[idx] += rs.lengths.exclusive[idx];
                lengths.cumulative[idx] += rs.lengths.cumulative[idx];
            }
        }

        return { angles, lengths };
    }
}
