import { AnglesLengths, NavalPGroupCount, NavalRankingClass, ProScoGroup, ProScoGroups } from './';
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

function count(counts: Summarize.Counts, nPGroups: number, pgrp: ProScoGroup | 'outlier') {
    let accumulateTo = ProScoGroups.indexOf(pgrp as ProScoGroup);
    if (accumulateTo < 0) accumulateTo = nPGroups;
    countWithEnd(counts, accumulateTo, nPGroups);
}

function countWithEnd(counts: Summarize.Counts, accumulateTo: number, max: number) {
    for (let idx = max; idx >= accumulateTo; idx--)
        counts.cumulative[idx]++;

    counts.exclusive[accumulateTo]++;
}

export namespace SummarizeProSco {
    export type CountsInGroup = {
        pGroup: ProScoGroup|'outlier',
        exclusive: number,
        cumulative: number,
    };

    export function angles(angles: { angle: Measurements.BondAngle, r: Measurements.Residue }[]) {
        const nPGroups = ProScoGroups.length;
        const counts = Summarize.Counts(nPGroups);

        for (const { angle, r } of angles)
            count(counts, ProScoGroups.length, AnglesLengths.anglePGroup(r.compound, angle)?.pGroup ?? 'outlier');

        return counts;
    }

    export function countsInGroups(counts: Summarize.Counts): Record<ProScoGroup | 'outlier', CountsInGroup> {
        const cig = {} as Record<ProScoGroup | 'outlier', CountsInGroup>;

        const grps = [...ProScoGroups, 'outlier'] as const;
        let _cumulative = 0;
        for (let idx = 0; idx < grps.length; idx++) {
            const grp = grps[idx];
            const cumulative = counts.cumulative[idx] ?? _cumulative;
            cig[grp] = {
                pGroup: grp,
                exclusive: counts.exclusive[idx] ?? 0,
                cumulative,
            };

            _cumulative = cumulative;
        }

        return cig;
    }

    export function lengths(lengths: { length: Measurements.BondLength, r: Measurements.Residue }[]) {
        const nPGroups = ProScoGroups.length;
        const counts = Summarize.Counts(nPGroups);

        for (const { length, r } of lengths)
            count(counts, nPGroups, AnglesLengths.lengthPGroup(r.compound, length)?.pGroup ?? 'outlier');

        return counts;
    }

    export function residue(r: Measurements.Residue): Summarize.Summary {
        const nPGroups = ProScoGroups.length;

        const angles = Summarize.Counts(nPGroups);
        const lengths = Summarize.Counts(nPGroups);

        for (const angle of r.bondAngles) {
            const pgrp = AnglesLengths.anglePGroup(r.compound, angle);
            count(angles, nPGroups, pgrp?.pGroup ?? 'outlier');
        }

        for (const length of r.bondLengths) {
            const pgrp = AnglesLengths.lengthPGroup(r.compound, length);
            count(lengths, nPGroups, pgrp?.pGroup ?? 'outlier');
        }

        return { angles, lengths };
    }

    export function substructure(residues: Measurements.Residue[]): Summarize.Summary {
        const nPGroups = ProScoGroups.length;

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
    const angleAvgs = AnglesLengths.angleAverages(r.compound, angle.triplet);

    const ret = AnglesLengths.navalRankingClass(
        angle.angle,
        ranking,
        M.d2r(navalAngle.csdPreferredLeft),
        M.d2r(navalAngle.csdPreferredRight),
        angleAvgs
    );

    return ret;
}

function rankNavalLength(naval: MappedNaval, r: Measurements.Residue, length: Measurements.BondLength) {
    const ranking = AnglesLengths.lengthNavalRanking(r.compound, length);
    const navalBond =  AnglesLengths.navalBond(naval, r, length.pair);
    const lengthAvgs = AnglesLengths.lengthAverages(r.compound, length.pair);

    return AnglesLengths.navalRankingClass(
        length.length,
        ranking,
        navalBond.csdPreferredLeft,
        navalBond.csdPreferredRight,
        lengthAvgs
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
