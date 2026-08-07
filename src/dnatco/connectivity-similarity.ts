import * as jsLLKA from 'jsllka';
import { Cif } from '../cif';
import { NtC } from './ntc';
import { Step } from './step';
import { AtomSite, AtomSite_Schema } from '../cif/categories/atom-site';
import { Logger } from '../log/logger';

export type Connectivity = {
    C5PrimeDistance: number;
    O3PrimeDistance: number;
}
export type Connectivities = Record<NtC.Class, Connectivity>;
export type AllConnectivities = { backward: Array<Connectivities|null>, forward: Array<Connectivities|null> };

export type Similarity = {
    rmsd: number;
    euclideanDistance: number;
}
export type Similarities = Record<NtC.Class, Similarity>;
export type AllSimilarities = Array<Similarities|null>;

const NtCsVector = jsLLKA.LLKA.makeStdVectorNtC();
for (const ntc of jsLLKA.NtCs)
    NtCsVector.push_back(ntc);
const NumNtCs = NtCsVector.size();

const NtCNames = Array.from(jsLLKA.IterateVector(NtCsVector)).map(ntc => jsLLKA.LLKA.NtCToName(ntc)) as NtC.Class[];

function columnValues<T>(column: Cif.Column<T>): (T|null)[]|null {
    return column.values as (T|null)[]|null;
}

function at<T>(column: (T|null)[]|null, row: number): T|null {
    return column === null ? null : column[row];
}

function atomColumns(atoms: Cif.Table<AtomSite_Schema>) {
    return {
        auth_asym_id: columnValues(atoms.auth_asym_id),
        auth_atom_id: columnValues(atoms.auth_atom_id),
        auth_comp_id: columnValues(atoms.auth_comp_id),
        auth_seq_id: columnValues(atoms.auth_seq_id),
        Cartn_x: columnValues(atoms.Cartn_x),
        Cartn_y: columnValues(atoms.Cartn_y),
        Cartn_z: columnValues(atoms.Cartn_z),
        id: columnValues(atoms.id),
        label_alt_id: columnValues(atoms.label_alt_id),
        label_asym_id: columnValues(atoms.label_asym_id),
        label_atom_id: columnValues(atoms.label_atom_id),
        label_comp_id: columnValues(atoms.label_comp_id),
        label_entity_id: columnValues(atoms.label_entity_id),
        label_seq_id: columnValues(atoms.label_seq_id),
        pdbx_PDB_ins_code: columnValues(atoms.pdbx_PDB_ins_code),
        pdbx_PDB_model_num: columnValues(atoms.pdbx_PDB_model_num),
        type_symbol: columnValues(atoms.type_symbol),
    };
}
type AtomColumns = ReturnType<typeof atomColumns>;

function makeLLKAAtom(cols: AtomColumns, row: number) {
    const labelSeqId = at(cols.label_seq_id, row)!;
    const authSeqId = at(cols.auth_seq_id, row);
    const altId = at(cols.label_alt_id, row);

    return jsLLKA.CLLKAAtom(
      at(cols.type_symbol, row)!,
      at(cols.label_atom_id, row)!,
      at(cols.label_entity_id, row)!,
      at(cols.label_comp_id, row)!,
      at(cols.label_asym_id, row)!,
      at(cols.auth_atom_id, row) ?? '',
      at(cols.auth_comp_id, row) ?? '',
      at(cols.auth_asym_id, row) ?? '',
      jsLLKA.CLLKAPoint(at(cols.Cartn_x, row)!, at(cols.Cartn_y, row)!, at(cols.Cartn_z, row)!),
      at(cols.id, row)!,
      labelSeqId,
      authSeqId ? authSeqId : labelSeqId,
      at(cols.pdbx_PDB_model_num, row) ?? 1,
      at(cols.pdbx_PDB_ins_code, row) ?? jsLLKA.NO_INSCODE,
      altId?.charCodeAt(0) ?? jsLLKA.NO_ALTID
    );
}

function gatherStepAtoms(step: Step, atoms: Cif.Table<AtomSite_Schema>) {
    const gathered = jsLLKA.CLLKAStructure();

    const cols = atomColumns(atoms);
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
        const belongsToStep =
          (resNo === step.resNo1 && (altId === null || altId === step.altPos1)) ||
          (resNo === step.resNo2 && (altId === null || altId === step.altPos2));

        if (belongsToStep)
            gathered.push_back(makeLLKAAtom(cols, row));
    }

    return gathered;
}

export function getStepsAtoms(steps: Step[], cif: Cif.Data) {
    const atoms = Cif.File.table(cif, AtomSite, 0);
    const gatheredAtoms = jsLLKA.CLLKAStructures();

    for (const step of steps)
        gatheredAtoms.push_back(gatherStepAtoms(step, atoms));

    return gatheredAtoms;
}

function calculateConnectivitiesInternal(currentStepStru: jsLLKA.LLKAStructure, prevStepStru: jsLLKA.LLKAStructure|undefined, nextStepStru: jsLLKA.LLKAStructure|undefined, ntc: jsLLKA.NtC) {
    let backward: Connectivities|null = null;
    let forward: Connectivities|null = null;
    // Are we connected backwards?
    if (prevStepStru) {
        const resConn = jsLLKA.measureStepConnectivityNtCsMultipleFirst(prevStepStru, NtCsVector, currentStepStru, ntc);
        if (resConn.isSuccess()) {
            const succ = resConn.success();
            const connectivities: Partial<Connectivities> = {};
            for (let jdx = 0; jdx < NumNtCs; jdx++)
                connectivities[NtCNames[jdx]] = { ...succ.get(jdx) };

            succ.delete();
            backward = connectivities as Connectivities;
        } else
            Logger.log(Logger.Severity.Warning, `Cannot measure connectivity: ${jsLLKA.LLKA.errorToString(resConn.failure())}`);

        resConn.delete();
    }

    // Are we connected forwards?
    if (nextStepStru) {
        const resConn = jsLLKA.LLKA.measureStepConnectivityNtCsMultipleSecond(currentStepStru, ntc, nextStepStru, NtCsVector);
        if (resConn.isSuccess()) {
            const succ = resConn.success();
            const connectivities: Partial<Connectivities> = {};
            for (let jdx = 0; jdx < NumNtCs; jdx++)
                connectivities[NtCNames[jdx]] = { ...succ.get(jdx) };

            succ.delete();
            forward = connectivities as Connectivities;
        } else
            Logger.log(Logger.Severity.Warning, `Cannot measure connectivity: ${jsLLKA.LLKA.errorToString(resConn.failure())}`);

        resConn.delete();
    }

    return { backward, forward };
}

export function calculateSimilaritiesInternal(stru: jsLLKA.LLKAStructure): Similarities|null {
    const resSimil = jsLLKA.LLKA.measureStepSimilarityNtCMultiple(stru, NtCsVector);

    if (resSimil.isSuccess()) {
        const similarities: Partial<Similarities> = {};
        const succ = resSimil.success();
        for (let jdx = 0; jdx < NumNtCs; jdx++)
            similarities[NtCNames[jdx]] = { ...succ.get(jdx) };

        succ.delete();
        resSimil.delete();

        return similarities as Similarities;
    } else {
        resSimil.delete();
        return null;
    }
}

export function calculateConnectivities(currentStep: Step, previousStep: Step|undefined, nextStep: Step|undefined, atoms: Cif.Table<AtomSite_Schema>) {
    const prevStepStru = previousStep ? gatherStepAtoms(previousStep, atoms) : void 0;
    const currentStepStru = gatherStepAtoms(currentStep, atoms);
    const nextStepStru = nextStep ? gatherStepAtoms(nextStep, atoms) : void 0;

    let backward: Connectivities|null = null;
    let forward: Connectivities|null = null;

    const ntc = jsLLKA.LLKA.nameToNtC(currentStep.closestNtC);
    if (ntc != jsLLKA.LLKA.NtC.LLKA_NANT) {
        // We should not ever get NANT here
        const conns = calculateConnectivitiesInternal(currentStepStru, prevStepStru, nextStepStru, ntc);
        backward = conns.backward;
        forward = conns.forward;
    }

    if (prevStepStru) prevStepStru.delete();
    currentStepStru.delete();
    if (nextStepStru) nextStepStru.delete();

    return { backward, forward };
}

export function calculateSimilarities(step: Step, atoms: Cif.Table<AtomSite_Schema>) {
    const stru = gatherStepAtoms(step, atoms);
    const similarities = calculateSimilaritiesInternal(stru);
    stru.delete();

    return similarities;
}


export function calculateAllConnectivities(steps: Step[], stepsAtoms: jsLLKA.LLKAStructures, previous: number[], next: number[], excludeSteps: Set<number> = new Set()): AllConnectivities {
    if (steps.length !== stepsAtoms.size())
        throw new Error(`Mismatching number of steps ${steps.length} and step atoms ${stepsAtoms.size()}`);

    const backward = new Array<Connectivities|null>();
    const forward = new Array<Connectivities|null>();

    for (let idx = 0; idx < steps.length; idx++) {
        if (excludeSteps.has(idx))
            continue;

        const prevStepIdx = previous[idx];
        const nextStepIdx = next[idx];

        const prevStepStru = prevStepIdx !== -1 ? stepsAtoms.get(prevStepIdx) : void 0;
        const currentStepStru = stepsAtoms.get(idx);
        const nextStepStru = nextStepIdx !== -1 ? stepsAtoms.get(nextStepIdx) : void 0;

        const ntc = jsLLKA.LLKA.nameToNtC(steps[idx].closestNtC);
        if (ntc == jsLLKA.LLKA.NtC.LLKA_NANT) {
            // This should never happen
            backward.push(null);
            forward.push(null);
        } else {
            const conns = calculateConnectivitiesInternal(currentStepStru, prevStepStru, nextStepStru, ntc);
            backward.push(conns.backward);
            forward.push(conns.forward);
        }

        if (prevStepStru) prevStepStru.delete();
        currentStepStru.delete();
        if (nextStepStru) nextStepStru.delete();
    }

    return { backward, forward };
}

export function calculateAllSimilarities(steps: Step[], stepsAtoms: jsLLKA.LLKAStructures) {
    if (steps.length !== stepsAtoms.size())
        throw new Error(`Mismatching number of steps ${steps.length} and step atoms ${stepsAtoms.size()}`);

    const allSimilarities: AllSimilarities = [];

    for (let idx = 0; idx < steps.length; idx++) {
        const stru = stepsAtoms.get(idx);
        const similarities = calculateSimilaritiesInternal(stru);
        allSimilarities.push(similarities);
    }

    return allSimilarities;
}
