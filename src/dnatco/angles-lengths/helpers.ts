import { AnglesLengths, NavalItem, NavalRankingClass, NavalRankingClasses, NavalRankingData, ProScoGroup, ProScoGroups } from './';
import { Bin, Bins } from './bin';
import { Measurements } from './measurements';
import { ALM } from '../alm';
import { Dnatcofication, MappedNaval } from '../dnatcofication';
import { sequence } from '../../util';
import { M } from "../../util/math";
import { InvalidModelIndex } from '../../util/structure-selection';

function compareMaybeBins(a: ALM.MaybeBin, b: ALM.MaybeBin) {
    const aOut = a === 'above' || a === 'below' || a === 'no-data';
    const bOut = b === 'above' || b === 'below' || b === 'no-data';

    if (aOut) {
        if (bOut)
            return 0;
        else
            return -1;
    } else if (bOut) {
        return 1;
    } else
        return (a as Bin).prosco - (b as Bin).prosco;
}

export namespace ByResidueHelpers {
    export type GatherWorst = {
        angles: {
            averages: (r: Measurements.Residue) => (Bins | undefined)[],
            bond: (r: Measurements.Residue) => Measurements.BondAngle[],
            naval: (naval: MappedNaval, r: Measurements.Residue) => NavalItem[],
            navalRanking: (r: Measurements.Residue) => NavalRankingData[],
            stats: (s: ALM.ResidueStats, idx: number) => ALM.ResidueStats['angles'][number],
            value: (ba: Measurements.BondAngle) => number,
        },
        lengths: {
            averages: (r: Measurements.Residue) => (Bins | undefined)[],
            bond: (r: Measurements.Residue) => Measurements.BondLength[],
            naval: (naval: MappedNaval, r: Measurements.Residue) => NavalItem[],
            navalRanking: (r: Measurements.Residue) => NavalRankingData[],
            stats: (s: ALM.ResidueStats, idx: number) => ALM.ResidueStats['lengths'][number],
            value: (ba: Measurements.BondLength) => number,
        },
    };
    const GatherWorst: GatherWorst = {
        angles: {
            averages: (r) => r.bondAngles.map((ba) => AnglesLengths.angleAverages(r.compound, ba.triplet)),
            bond: (r) => r.bondAngles,
            naval: (naval, r) => r.bondAngles.map((ba) => {
                const x = AnglesLengths.navalAngle(naval, r, ba.triplet);
                return {
                    value: x.value,
                    csdPreferredLeft: M.d2r(x.csdPreferredLeft),
                    csdPreferredRight: M.d2r(x.csdPreferredRight),
                };
            }),
            navalRanking: (r) => r.bondAngles.map((ba) => AnglesLengths.angleNavalRanking(r.compound, ba)),
            stats: (s, idx) => s.angles[idx],
            value: (ba) => ba.angle,
        },
        lengths: {
            averages: (r) => r.bondLengths.map((bl) => AnglesLengths.lengthAverages(r.compound, bl.pair)),
            bond: (r) => r.bondLengths,
            naval: (naval, r) => r.bondLengths.map((bl) => AnglesLengths.navalBond(naval, r, bl.pair)),
            navalRanking: (r) => r.bondLengths.map((bl) => AnglesLengths.lengthNavalRanking(r.compound, bl)),
            stats: (s, idx) => s.lengths[idx],
            value: (bl) => bl.length,
        },

    };

    function cmpNavalClass(a: NavalRankingClass, b: NavalRankingClass) {
        const iA = NavalRankingClasses.indexOf(a);
        const iB = NavalRankingClasses.indexOf(b);

        return iA - iB;
    }
    function cmpProScoGroup(a: ProScoGroup, b: ProScoGroup) {
        const iA = ProScoGroups.indexOf(a);
        const iB = ProScoGroups.indexOf(b);

        return iA - iB;
    }
    export function gatherWorst<T extends keyof GatherWorst>(mappedNaval: MappedNaval, metrics: 'prosco' | 'naval', gather: T, residues: Measurements.Residue[], stats: ALM.ResidueStats[], threshold: string, maxCount: number | 'all') {
        type PT = ReturnType<GatherWorst[T]['bond']>[number];
        const worst = new Array<{
            bond: PT,
            residue: Measurements.Residue,
            maybeBin: ALM.MaybeBin,
            pGroup: AnglesLengths.PGroup,
            navalClass: NavalRankingClass,
        }>();
        const getter = GatherWorst[gather];

        for (let idx = 0; idx < residues.length; idx++) {
            const r = residues[idx];
            const s = stats[idx];

            for (let jdx = 0; jdx < r.bondLengths.length; jdx++) {
                // ProSco part
                const x = getter.bond(r)[jdx];
                const ls = getter.stats(s, jdx);
                const thr = ls.pGroup?.pGroup ?? 'outlier';
                // NA-VAL part
                const avgs = getter.averages(r)[jdx];
                const { csdPreferredLeft, csdPreferredRight } = getter.naval(mappedNaval, r)[jdx];
                const nrank = getter.navalRanking(r)[jdx];
                const navalClass = AnglesLengths.navalRankingClass(
                    getter.value(x as any),
                    nrank,
                    csdPreferredLeft,
                    csdPreferredRight,
                    avgs
                );

                if (metrics === 'prosco') {
                    if (thr === 'outlier' || (threshold !== 'outlier' && cmpProScoGroup(thr as any, threshold as any) <= 0)) {
                        let kdx = 0;
                        for (; kdx < worst.length; kdx++) {
                            if (compareMaybeBins(ls.bin, worst[kdx].maybeBin) <= 0)
                                break;
                        }

                        const tail = worst.splice(
                            kdx,
                            worst.length - kdx,
                            {
                                bond: x,
                                residue: r,
                                maybeBin: ls.bin,
                                pGroup: ls.pGroup,
                                navalClass,
                            }
                        );
                        worst.push(...tail);
                    }
                } else if (metrics === 'naval') {
                    if (cmpNavalClass(navalClass, threshold as any) >= 0) {
                        let kdx = 0;
                        for (; kdx < worst.length; kdx++) {
                            if (compareMaybeBins(ls.bin, worst[kdx].maybeBin) <= 0)
                                break;
                        }

                        console.log(navalClass, threshold);

                        const tail = worst.splice(
                            kdx,
                            worst.length - kdx,
                            {
                                bond: x,
                                residue: r,
                                maybeBin: ls.bin,
                                pGroup: ls.pGroup,
                                navalClass,
                            }
                        );
                        worst.push(...tail);
                    }
                }
            }
        }

        if (maxCount !== 'all' && worst.length > maxCount)
            worst.length = maxCount;

        return worst;
    }

    export function selectionToIndices(d: Dnatcofication, modelIdx: number, chain: string) {
        const alm = d.data.almByResidue;
        if (modelIdx === InvalidModelIndex) {
            return sequence(0, alm.residues.length - 1);
        } else {
            const modelNum = d.data.structures[0].models[modelIdx].num;

            if (chain)
                return alm.chains.get(modelNum)?.get(chain) ?? [];
            else
                return alm.models.get(modelNum) ?? [];
        }
    }
}
