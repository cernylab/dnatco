/* * * * * * * * * * * * * * * * * * * * *
 *                                       *
 * THIS CODE WILL BE REPLACED WITH CODE  *
 * THAT WILL CALCULATE RSCC DIRECTLY     *
 * FROM THE STRUCTURE AND DENSITY MAP.   *
 *                                       *
 * THIS IS JUST A LAME STOPGAP MEASURE.  *
 *                                       *
 * * * * * * * * * * * * * * * * * * * * */

import { ErrorResult, OkResult } from './';
import { Dnatcofication } from './dnatcofication';
import { Residues } from './residues';
import { Rscc as RemoteRscc } from '../remote/rscc';
import { StepsMapper } from './steps-mapper';
import { fromTemplate, isObj, isType } from '../util/json';

const BackdropRscc = {
    rsccMinActual: 0,
    rsccMaxActual: 0,
    rmsdMinActual: 0,
    rmsdMaxActual: 0,

    rsccMinPlotted: 0,
    rsccMaxPlotted: 0,
    rmsdMinPlotted: 0,
    rmsdMaxPlotted: 0,

    rsccCells: 0,
    rmsdCells: 0,
    z: [] as number[][],

    distribution: [0, 0, 0, 0] as [ q1: number, q2: number, q3: number, q4: number ],
};

const BackdropRsccCache = {
    'dna-assigned': BackdropRscc,
    'dna-unassigned': BackdropRscc,
    'rna-assigned': BackdropRscc,
    'rna-unassigned': BackdropRscc,
};
type BackdropRsccCache = typeof BackdropRsccCache;

const RsccCache = new Map<string, Rscc.StructureRscc[]>();

function isBackdropRscc(v: unknown): v is Rscc.BackdropRscc {
    const templ = (v: unknown): v is Rscc.BackdropRscc => {
        if (!isObj(v))
            return false;
        return fromTemplate(v, BackdropRscc) !== undefined;
    };
    return isType(v, templ);
}

function isBackdropRsccSane(bdrop: Rscc.BackdropRscc) {
    if (bdrop.rsccMinActual >= bdrop.rsccMaxActual ||
        bdrop.rmsdMinActual >= bdrop.rmsdMaxActual ||
        bdrop.rsccMinPlotted >= bdrop.rsccMaxPlotted ||
        bdrop.rmsdMinPlotted >= bdrop.rmsdMaxPlotted ||
        bdrop.rsccCells < 2 || bdrop.rmsdCells < 2 || bdrop.distribution.length !== 4)
        return false;

    if (bdrop.z.length !== bdrop.rsccCells)
        return false;

    for (const _z of bdrop.z) {
        if (_z.length !== bdrop.rmsdCells)
            return false;
    }

    return true;
}

function makeBackdropRsccUrl(kind: keyof BackdropRsccCache) {
    const url = './rscc/backdrops/' +
        (kind === 'dna-assigned'
            ? 'dna_assigned.json'
            : kind === 'dna-unassigned'
                ? 'dna_unassigned.json'
                : kind === 'rna-assigned'
                    ? 'rna_assigned.json'
                    : 'rna_unassigned.json');

    return url;
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
    export type BackdropRscc = typeof BackdropRscc;
    export type BackdropRsccKind = keyof BackdropRsccCache;
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

    export async function backdropRscc(kind: BackdropRsccKind) {
        if (isBackdropRsccEmpty(BackdropRsccCache[kind])) {
            try {
                const req = await fetch(makeBackdropRsccUrl(kind));
                if (!req.ok)
                    return ErrorResult(req.statusText);

                const bdrop = await req.json();
                if (!isBackdropRscc(bdrop))
                    return ErrorResult('Invalid backdrop RSCC data');

                if (!isBackdropRsccSane(bdrop))
                    return ErrorResult('Malformed backdrop RSCC data');

                BackdropRsccCache[kind] = bdrop;
            } catch (e) {
                return ErrorResult((e as Error).toString());
            }
        }

        return OkResult(BackdropRsccCache[kind]);
    }

    export function emptyBackdropRscc(): BackdropRscc {
        return { ...BackdropRscc };
    }

    export function isBackdropRsccEmpty(bdrop: Rscc.BackdropRscc) {
        return bdrop.z.length === 0;
    }

    export async function structureRscc(d: Dnatcofication, modelIdx: number) {
        const pdbId = d.pdbId.toLowerCase();

        const cached = RsccCache.get(pdbId);
        if (cached && cached[modelIdx])
            return OkResult(cached[modelIdx]);

        try {
            const rsccList = d.data.rscc.length > 0
                ? d.data.rscc
                : d.data.isCustomStructure ? [] : await RemoteRscc.fetchFromDb(pdbId);

            if (rsccList.length === 0)
                return ErrorResult('No data have been calculated for this structure');

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
