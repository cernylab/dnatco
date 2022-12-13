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

function isRsccList(v: any): v is number[] {
    return isArr(v, isNum);
}

export namespace Rscc {
    export type StepRscc = { stepId: number, rmsd: number, hRscc: number };
    export type StructureRscc = {
        assigned: StepRscc[];
        unassigned: StepRscc[];
    };

    function calculateRscc(d: Dnatcofication, modelIdx: number, rsccList: number[]): StructureRscc {
        const assigned = new Array<StepRscc>();
        const unassigned = new Array<StepRscc>();

        const m = d.data.structures[0].models[modelIdx];
        const steps = StepsMapper.segment(d, modelIdx);
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

            // NO NO NO: This assumes that atomId corresponds to its index in rsccList.
            // This assumption is very optimistic but good enough for the stopgap code
            let harmAvgEstimate = 0; // Estimate because we shift the rscc into the [0.0, 2.0] band and unshift the result back
            let counted = 0;
            for (const id of atomIds) {
                const rscc = rsccList[id - 1];
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
