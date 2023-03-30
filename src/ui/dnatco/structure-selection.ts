import { Subject } from 'rxjs';
import { filterToChain }  from './util';
import { ViewerInterop } from '../../viewer/viewer-interop';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';

export const InvalidModelIndex = -1;
export const InvalidChain = '';
export const InvalidResidue = { modelNum: -1, chain: '', seqId: -1, altId: '' } as CifResidue;
export const InvalidStepId = -1;

export type AuthResidue = {
    modelNum: number,
    chain: string,
    cifChain: string,
    seqId: number,
    insCode: string,
    altId: string,
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
    residues: CifResidue[], // Residue described with cif naming (label_)
}

export namespace StructureSelection {
    export function authToCif(stru: Structure, r: AuthResidue): CifResidue | undefined {
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

    export function cifToAuth(stru: Structure, r: CifResidue): AuthResidue | undefined {
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

    export function cifResiduesMatch(a: CifResidue, b: CifResidue) {
        return (
            a.modelNum === b.modelNum &&
            a.chain === b.chain &&
            a.seqId === b.seqId &&
            a.altId == a.altId
        );
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

        const selections = viewerInterop.api.query('selected-structures');

        for (const sel of selections) {
            if (sel.type === 'step') {
                const step = StepsMapper.byName(dnatcofication, sel.name);
                if (step)
                    steps.push(step.id);
            } else if (sel.type === 'residue') {
                const residue = StructureSelection.authToCif(dnatcofication.data.structures[0], { ...sel });
                if (residue)
                    residues.push(residue);
            }
        }

        return { modelIndex, chain, steps, residues };
    } else
        return EmptyStructureSelection(dnatcofication);
}

export function EmptyStructureSelection(d: Dnatcofication): StructureSelection {
    return {
        modelIndex: d.data.structures[0].models.length === 1 ? 0 : InvalidModelIndex,
        chain: InvalidChain,
        steps: [],
        residues: [],
    };
}

export type SelectedPieces = {
    steps: StructureSelection['steps'],
    residues: StructureSelection['residues'],
    reconstruct: boolean,
}
export function SelectedPieces(steps: number[], residues: SelectedPieces['residues'], reconstruct: boolean): SelectedPieces {
    return { steps, residues, reconstruct };
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
