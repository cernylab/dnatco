import * as jsLLKA from 'jsLLKA';
import { Cif } from '../cif';
import { AtomSite, AtomSite_Schema } from '../cif/categories/atom-site';
import { NtC } from './ntc';

export type Connectivity = {
    C5PrimeDistance: number;
    O3PrimeDistance: number;
}
export type Connectivities = Record<NtC.Conformer, Connectivity>;
export type AllConnectivities = { backward: Array<Connectivities|null>, forward: Array<Connectivities|null> };

export type Similarity = {
    rmsd: number;
    euclideanDistance: number;
}
export type Similarities = Record<NtC.Conformer, Similarity>;
export type AllSimilarities = Array<Similarities|null>;

const NtCsVector = jsLLKA.LLKA.makeStdVectorNtC();
for (const ntc of jsLLKA.NtCs)
    NtCsVector.push_back(ntc);
const NumNtCs = NtCsVector.size();

const NtCNames = Array.from(jsLLKA.IterateVector(NtCsVector)).map(ntc => jsLLKA.LLKA.NtCToName(ntc));

function gatherStepAtoms(step: NtC.Step, atoms: Cif.Table<AtomSite_Schema>) {
    const gathered = [];

    const pdbx_PDB_model_num = atoms.pdbx_PDB_model_num.values!;
    const label_asym_id = atoms.label_asym_id.values!;
    const label_seq_id = atoms.label_seq_id.values!;
    const label_alt_id = atoms.label_alt_id.values!;

    for (let row = 0; row < atoms._rowCount; row++) {
        if (pdbx_PDB_model_num[row] !== step.model)
            continue;
        if (label_asym_id[row] !== step.chain)
            continue;

        const resNo = label_seq_id[row];
        const altId = label_alt_id[row];
        if (resNo === step.resNo1 && (altId === null || altId === step.altPos1)) {
            const atom = Cif.Row(atoms, row);
            gathered.push(
                jsLLKA.Atom({
                    type_symbol: atom.type_symbol!,
                    label_atom_id: atom.label_atom_id!,
                    label_comp_id: atom.label_comp_id!,
                    label_asym_id: atom.label_asym_id!,
                    auth_atom_id: atom.auth_atom_id ?? atom.label_atom_id!,
                    coords: new jsLLKA.LLKA.Point(atom.Cartn_x, atom.Cartn_y, atom.Cartn_z),
                    id: atom.id!,
                    label_seq_id: atom.label_seq_id!,
                    auth_seq_id: atom.auth_seq_id ?? atom.label_seq_id!,
                    pdbx_PDB_model_num: atom.pdbx_PDB_model_num ?? 1,
                    label_alt_id: atom.label_alt_id ?? ''
                })
            );
        } else if (resNo === step.resNo2 && (altId === null || altId === step.altPos2)) {
            const atom = Cif.Row(atoms, row);
            gathered.push(
                jsLLKA.Atom({
                    type_symbol: atom.type_symbol!,
                    label_atom_id: atom.label_atom_id!,
                    label_comp_id: atom.label_comp_id!,
                    label_asym_id: atom.label_asym_id!,
                    auth_atom_id: atom.auth_atom_id ?? atom.label_atom_id!,
                    coords: new jsLLKA.LLKA.Point(atom.Cartn_x, atom.Cartn_y, atom.Cartn_z),
                    id: atom.id!,
                    label_seq_id: atom.label_seq_id!,
                    auth_seq_id: atom.auth_seq_id ?? atom.label_seq_id!,
                    pdbx_PDB_model_num: atom.pdbx_PDB_model_num ?? 1,
                    label_alt_id: atom.label_alt_id ?? ''
                })
            );
        }
    }

    return gathered;
}

export function getStepAtomsNative(steps: NtC.Step[], cif: Cif.Cif) {
    const atoms = cif.table(AtomSite, 0);
    const gatheredAtoms = [];

    for (const step of steps)
        gatheredAtoms.push(gatherStepAtoms(step, atoms));

    return gatheredAtoms;
}

export function getConnectivities(steps: NtC.Step[], stepAtoms: jsLLKA.LLKAAtom[][], previous: number[], next: number[]): AllConnectivities {
    if (steps.length !== stepAtoms.length)
        throw new Error(`Mismatching number of steps ${steps.length} and step atoms ${stepAtoms.length}`);

    const backward = new Array<Connectivities|null>();
    const forward = new Array<Connectivities|null>();

    for (let idx = 0; idx < steps.length; idx++) {
        const prevStepIdx = previous[idx];
        const nextStepIdx = next[idx];

        const prevStepStru = prevStepIdx !== -1 ? jsLLKA.StructureFromNative(stepAtoms[prevStepIdx]) : null;
        const currentStepStru = jsLLKA.StructureFromNative(stepAtoms[idx]);
        const nextStepStru = nextStepIdx !== -1 ? jsLLKA.StructureFromNative(stepAtoms[nextStepIdx]) : null;

        const ntc = jsLLKA.LLKA.nameToNtC(steps[idx].closestNtC);
        if (ntc == jsLLKA.LLKA.NtC.LLKA_NANT) {
            // This should never happen
            backward.push(null);
            forward.push(null);
            continue;
        }

        // Are we connected backwards?
        if (prevStepStru) {
            const resConn = new jsLLKA.RCResult<jsLLKA.Connectivities>(jsLLKA.LLKA.measureStepConnectivityNtCsMultipleFirst(prevStepStru, NtCsVector, currentStepStru, ntc));
            if (resConn.isSuccess()) {
                const succ = resConn.success();
                const connectivities: Connectivities = {};
                for (let jdx = 0; jdx < NumNtCs; jdx++)
                    connectivities[NtCNames[jdx]] = { ...succ.get(jdx) };

                succ.delete();
                backward.push(connectivities);
            } else {
                console.warn(`Cannot measure connectivity: ${jsLLKA.LLKA.errorToString(resConn.failure())}`);
                backward.push(null);
            }

            resConn.release();
        } else
            backward.push(null);

        // Are we connected forwards?
        if (nextStepStru) {
            const resConn = new jsLLKA.RCResult<jsLLKA.Connectivities>(jsLLKA.LLKA.measureStepConnectivityNtCsMultipleSecond(currentStepStru, ntc, nextStepStru, NtCsVector));
            if (resConn.isSuccess()) {
                const succ = resConn.success();
                const connectivities: Connectivities = {};
                for (let jdx = 0; jdx < NumNtCs; jdx++)
                    connectivities[NtCNames[jdx]] = { ...succ.get(jdx) };

                succ.delete();
                forward.push(connectivities);
            } else {
                console.warn(`Cannot measure connectivity: ${jsLLKA.LLKA.errorToString(resConn.failure())}`);
                forward.push(null);
            }

            resConn.release();
        } else
            forward.push(null);

        if (prevStepStru) prevStepStru.delete();
        currentStepStru.delete();
        if (nextStepStru) nextStepStru.delete();
    }

    return { backward, forward };
}

export function getSimilarities(steps: NtC.Step[], stepAtoms: jsLLKA.LLKAAtom[][]) {
    if (steps.length !== stepAtoms.length)
        throw new Error(`Mismatching number of steps ${steps.length} and step atoms ${stepAtoms.length}`);

    const allSimilarities: AllSimilarities = [];

    for (let idx = 0; idx < steps.length; idx++) {
        const stru = jsLLKA.StructureFromNative(stepAtoms[idx]);

        const resSimil = new jsLLKA.RCResult<jsLLKA.Similarities>(jsLLKA.LLKA.measureStepSimilarityNtCMultiple(stru, NtCsVector));
        stru.delete();

        if (resSimil.isSuccess()) {
            const similarities: Similarities = {};
            const succ = resSimil.success();
            for (let idx = 0; idx < NumNtCs; idx++)
                similarities[NtCNames[idx]] = { ...succ.get(idx) };

            succ.delete();
            allSimilarities.push(similarities);
        } else
            allSimilarities.push(null);

        resSimil.release();
    }

    return allSimilarities;
}

export function releaseNativeAtoms(atoms: jsLLKA.LLKAAtom[][]) {
    atoms.forEach(ats => ats.forEach(at => at.delete()));
}
