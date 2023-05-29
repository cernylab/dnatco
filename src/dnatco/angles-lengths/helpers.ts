import { AnglesLengths } from './';
import { Bin } from './bin';
import { Measurements } from './measurements';
import { ALM } from '../alm';
import { Dnatcofication } from '../dnatcofication';
import { InvalidModelIndex } from '../../ui/dnatco/structure-selection';
import { sequence } from '../../util';

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
            bond: (r: Measurements.Residue) => Measurements.BondAngle[],
            stats: (s: ALM.ResidueStats, idx: number) => ALM.ResidueStats['angles'][number],
        },
        lengths: {
            bond: (r: Measurements.Residue) => Measurements.BondLength[],
            stats: (s: ALM.ResidueStats, idx: number) => ALM.ResidueStats['lengths'][number],
        },
    };
    const GatherWorst: GatherWorst = {
        angles: {
            bond: (r) => r.bondAngles,
            stats: (s, idx) => s.angles[idx],
        },
        lengths: {
            bond: (r) => r.bondLengths,
            stats: (s, idx) => s.lengths[idx],
        },

    };
    export function gatherWorst<T extends keyof GatherWorst>(gather: T, residues: Measurements.Residue[], stats: ALM.ResidueStats[], threshold: number|'outlier', maxCount: number | 'all') {
        type PT = ReturnType<GatherWorst[T]['bond']>[number];
        const worst = new Array<{
            bond: PT,
            residue: Measurements.Residue,
            maybeBin: ALM.MaybeBin,
            pGroup: AnglesLengths.PGroup,
        }>();
        const getter = GatherWorst[gather];

        for (let idx = 0; idx < residues.length; idx++) {
            const r = residues[idx];
            const s = stats[idx];

            for (let jdx = 0; jdx < r.bondLengths.length; jdx++) {
                const x = getter.bond(r)[jdx];
                const ls = getter.stats(s, jdx);
                const thr: typeof threshold = ls.pGroup?.threshold ?? 'outlier';

                if (thr === 'outlier' || (threshold !== 'outlier' && thr >= threshold)) {
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
                            pGroup: ls.pGroup
                        }
                    );
                    worst.push(...tail);
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
