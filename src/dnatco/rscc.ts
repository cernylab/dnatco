/* * * * * * * * * * * * * * * * * * * * *
 *                                       *
 * THIS CODE WILL BE REPLACED WITH CODE  *
 * THAT WILL CALCULATE RSCC DIRECTLY     *
 * FROM THE STRUCTURE AND DENSITY MAP.   *
 *                                       *
 * THIS IS JUST A LAME STOPGAP MEASURE.  *
 *                                       *
 * * * * * * * * * * * * * * * * * * * * */

import { ErrorResult, OkResult, Result } from './';
import { Dnatcofication } from './dnatcofication';
import { Residues } from './residues';
import { StepsMapper } from './steps-mapper';
import { isArr, isNum } from '../util/json';

const RsccCache = new Map<string, Rscc.StructureRscc[]>();

function isRsccList(v: any): v is [atomId: number, rscc: number][] {
    return isArr(v, (x: unknown): x is [atomId: number, rscc: number] => {
        if (!isArr(x, isNum))
            return false;
        return x.length === 2;
    });
}

// TODO: Remove the slow path warning
let slowPath = 0;
function findRscc(atomId: number, list: [atomId: number, rscc: number][], startIdx = 0): { rscc: number, idx: number }|undefined {
    for (let idx = startIdx; idx < list.length; idx++) {
        const v = list[idx];
        if (v[0] === atomId)
            return { rscc: v[1], idx };
    }
    const idx = list.findIndex(x => x[0] === atomId);

    console.warn(`RSCC lookup slow path when looking for atomId ${atomId} from index ${startIdx}, total hits ${++slowPath}`);

    return idx >= 0 ? { rscc: list[idx][1], idx } : undefined;

}

export namespace Rscc {
    export type StepRscc = { stepId: number, rmsd: number, hRscc: number };
    export type StructureRscc = {
        assigned: StepRscc[];
        unassigned: StepRscc[];
    };

    function calculateRscc(d: Dnatcofication, modelIdx: number, rsccList: [atomId: number, rscc: number][]): StructureRscc {
        const assigned = new Array<StepRscc>();
        const unassigned = new Array<StepRscc>();

        const m = d.data.structures[0].models[modelIdx];
        const steps = StepsMapper.segment(d, modelIdx);
        let lastAtomIndex = 0;
        for (const step of steps) {
            const chain = m.chains.find(x => x.name === step.chain)!;
            const r1 = chain.residues.find(x => x.num === step.resNo1);
            const r2 = chain.residues.find(x => x.num === step.resNo2);
            if (!r1 || !r2)
                continue;

            const base1 = Residues.StandardResidueKinds.get(r1.compound);
            const base2 = Residues.StandardResidueKinds.get(r2.compound);
            if (!base1 || !base2)
                continue; // Ignore non-standard residues for now

            const atomIds = [];
            for (const atom of r1.atoms) {
                if (Residues.AnchorAtoms.backbone.first.includes(atom.atomId) || Residues.AnchorAtoms.base[base1].includes(atom.atomId))
                    atomIds.push(atom.id);
            }
            for (const atom of r2.atoms) {
                if (Residues.AnchorAtoms.backbone.second.includes(atom.atomId) || Residues.AnchorAtoms.base[base2].includes(atom.atomId))
                    atomIds.push(atom.id);
            }

            atomIds.sort((a, b) => a - b);
            if (atomIds.length === 0)
                continue;

            let harmAvgEstimate = 0; // Estimate because we shift the rscc into the [0.0, 2.0] band and unshift the result back
            let counted = 0;

            let found = findRscc(atomIds[0], rsccList, lastAtomIndex);
            let rollbackAtomIndex = found ? found.idx : lastAtomIndex;
            lastAtomIndex = rollbackAtomIndex;

            for (const id of atomIds) {
                const found = findRscc(id, rsccList, lastAtomIndex);
                if (!found)
                    continue;
                lastAtomIndex = found.idx;

                const rscc = found.rscc;
                if (rscc <= -1.0)
                    continue;

                harmAvgEstimate += 1.0 / (rscc + 1.0);
                counted++;
            }
            harmAvgEstimate = (counted / harmAvgEstimate) - 1.0;

            if (step.NtC === 'NANT')
                unassigned.push({ stepId: step.id, rmsd: step.rmsd, hRscc: harmAvgEstimate });
            else
                assigned.push({ stepId: step.id, rmsd: step.rmsd, hRscc: harmAvgEstimate });

            // Go back to this index because we will very likely need to start the search
            // from the top of what is now the second residue in the current step but will
            // be the first residue of the next step.
            lastAtomIndex = rollbackAtomIndex;
        }

        return { assigned, unassigned };
    }

    export async function structureRscc(d: Dnatcofication, modelIdx: number): Promise<Result<StructureRscc>> {
        const pdbId = d.pdbId.toLowerCase();

        const cached = RsccCache.get(pdbId);
        if (cached && cached[modelIdx])
            return OkResult(cached[modelIdx]);

        try {
            const req = await fetch(`./rscc/${pdbId}.rscc`);
            if (!req.ok)
                return ErrorResult(req.statusText);

            const rsccList = await req.json();
            if (!isRsccList(rsccList))
                return ErrorResult('Invalid data');

            rsccList.sort((a, b) => a[0] - b[0]);

            const res = calculateRscc(d, modelIdx, rsccList);

            const cache = RsccCache.get(pdbId) ?? [];
            cache[modelIdx] = res;
            RsccCache.set(pdbId, cache);

            return OkResult(res);
        } catch (e) {
            return ErrorResult((e as Error).toString());
        }
    }
}
