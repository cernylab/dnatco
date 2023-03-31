import { Subject } from 'rxjs';
import { filterToChain }  from './util';
import { ViewerInterop } from '../../viewer/viewer-interop';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { objKeys } from '../../util';

export const InvalidAtom: CifAtom = { modelNum: -1, chain: '', seqId: -1, altId: '', atomId: '' };
export const InvalidModelIndex = -1;
export const InvalidChain = '';
export const InvalidResidue: CifResidue = { modelNum: -1, chain: '', seqId: -1, altId: '' };
export const InvalidStepId = -1;

export type AuthAtom = {
    modelNum: number,
    chain: string,
    cifChain: string,
    seqId: number,
    insCode: string,
    altId: string,
    cifAtomId: string,
}

export type AuthResidue = {
    modelNum: number,
    chain: string,
    cifChain: string,
    seqId: number,
    insCode: string,
    altId: string,
}

export type CifAtom = {
    modelNum: number,
    chain: string,
    seqId: number,
    altId: string,
    atomId: string,
}

export type CifResidue = {
    modelNum: number,
    chain: string,
    seqId: number,
    altId: string,
}

export type StructureSelection = {
    modelIndex: number,
    chain: string,
    steps: number[], // Array of step IDs
    residues: CifResidue[],
    atoms: CifAtom[],
}

export namespace StructureSelection {
    export function authToCifAtom(stru: Structure, a: AuthAtom): CifAtom | undefined {
        const model = stru.models.find((x) => x.num === a.modelNum);
        if (!model)
            return void 0;

        const chain = model.chains.find((x) => x.authName === a.chain && x.name === a.cifChain);
        if (!chain)
            return void 0;

        const residue = chain.residues.find((x) => x.authNum === a.seqId && (x.insCode || '') ===  a.insCode);
        if (!residue)
            return void 0;

        const atom = residue.atoms.find((x) => x.atomId === a.cifAtomId);
        return atom ? { modelNum: a.modelNum, chain: chain.name, seqId: residue.num, altId: a.altId, atomId: atom.atomId } : void 0;
    }

    export function authToCifResidue(stru: Structure, r: AuthResidue): CifResidue | undefined {
        const model = stru.models.find((x) => x.num === r.modelNum);
        if (!model)
            return void 0;

        const chain = model.chains.find((x) => x.authName === r.chain && x.name === r.cifChain);
        if (!chain)
            return void 0;

        const residue = chain.residues.find((x) => x.authNum === r.seqId && (x.insCode || '') ===  r.insCode);
        if (!residue)
            return void 0;

        return { modelNum: r.modelNum, chain: chain.name, seqId: residue.num, altId: r.altId };
    }

    export function cifToAuthAtom(stru: Structure, a: CifAtom): AuthAtom | undefined {
        const model = stru.models.find((x) => x.num === a.modelNum);
        if (!model)
            return void 0;

        const chain = model.chains.find((x) => x.name === a.chain);
        if (!chain)
            return void 0;

        const residue = chain.residues.find((x) => x.num === a.seqId);
        if (!residue)
            return void 0;

        const atom = residue.atoms.find((x) => x.atomId === a.atomId);
        return atom
            ? {
                modelNum: a.modelNum,
                chain: chain.authName,
                cifChain: chain.name,
                seqId: residue.authNum,
                insCode: residue.insCode || '',
                altId: a.altId,
                cifAtomId: a.atomId,
            }
            : void 0;
    }

    export function cifToAuthResidue(stru: Structure, r: CifResidue): AuthResidue | undefined {
        const model = stru.models.find((x) => x.num === r.modelNum);
        if (!model)
            return void 0;

        const chain = model.chains.find((x) => x.name === r.chain);
        if (!chain)
            return void 0;

        const residue = chain.residues.find((x) => x.num === r.seqId);
        if (!residue)
            return void 0;

        return { modelNum: r.modelNum, chain: chain.authName, cifChain: chain.name, seqId: residue.authNum, insCode: residue.insCode || '', altId: r.altId };
    }

    const CifAtomCmpKeys = objKeys(InvalidAtom);
    export function cifAtomsMatch(a: CifAtom, b: CifAtom) {
        for (const key of CifAtomCmpKeys) {
            if (a[key] !== b[key])
                return false;
        }

        return true;
    }

    const CifResidueCmpKeys = objKeys(InvalidResidue);
    export function cifResiduesMatch(a: CifResidue, b: CifResidue) {
        for (const key of CifResidueCmpKeys) {
            if (a[key] !== b[key])
                return false;
        }

        return true;
    }
}

export function StructureSelectionFromViewer(viewerInterop: ViewerInterop, dnatcofication: Dnatcofication): StructureSelection {
    if (viewerInterop.ready()) {
        const modelNumber = viewerInterop.api.query('current-model-number');
        const modelIndex = dnatcofication.data.structures[0].models.findIndex((x) => x.num === modelNumber);

        const currentFilter = viewerInterop.api.query('current-filter');
        const chain = modelIndex !== InvalidModelIndex ? filterToChain(dnatcofication, modelIndex, currentFilter) : InvalidChain;

        const steps = [] as StructureSelection['steps'];
        const residues = [] as StructureSelection['residues'];
        const atoms = [] as StructureSelection['atoms'];

        const selections = viewerInterop.api.query('selected-structures');

        for (const sel of selections) {
            if (sel.type === 'step') {
                const step = StepsMapper.byName(dnatcofication, sel.name);
                if (step)
                    steps.push(step.id);
            } else if (sel.type === 'residue') {
                const residue = StructureSelection.authToCifResidue(dnatcofication.data.structures[0], { ...sel });
                if (residue)
                    residues.push(residue);
            } else if (sel.type === 'atom') {
                const atom = StructureSelection.authToCifAtom(dnatcofication.data.structures[0], { ...sel });
                if (atom)
                    atoms.push(atom);
            }
        }

        return { modelIndex, chain, steps, residues, atoms };
    } else
        return EmptyStructureSelection(dnatcofication);
}

export function EmptyStructureSelection(d: Dnatcofication): StructureSelection {
    return {
        modelIndex: d.data.structures[0].models.length === 1 ? 0 : InvalidModelIndex,
        chain: InvalidChain,
        steps: [],
        residues: [],
        atoms: [],
    };
}

export type SelectedPieces = {
    steps: StructureSelection['steps'],
    residues: StructureSelection['residues'],
    atoms: StructureSelection['atoms'],
    reconstruct: boolean,
}
export function SelectedPieces(steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'], reconstruct: boolean): SelectedPieces {
    return { steps, residues, atoms, reconstruct };
}
export const EmptySelectionPieces: SelectedPieces = {
    steps: [],
    residues: [],
    atoms: [],
    reconstruct: true,
}

export type SelectionDisplayer = (pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop, customNtCSet: string) => Promise<void>;

export type StructureSelectionSwitching = {
    changeSelection: (pieces: SelectedPieces, displayer: SelectionDisplayer) => void,
    switchModel: (modelIndex: number) => void,
    switchChain: (chain: string) => void,
    events: {
        modelSwitched: Subject<StructureSelection>,
        chainSwitched: Subject<StructureSelection>,
        selectionChanged: Subject<StructureSelection>,
    },
}
