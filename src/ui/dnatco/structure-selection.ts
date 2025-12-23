import { Subject } from 'rxjs';
import { filterToChain }  from './util';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { BasePairsMapper } from '../../dnatco/base-pairs-mapper';
import {
    EmptyStructureSelection,
    InvalidChain, InvalidModelIndex,
    StructureSelection
} from '../../util/structure-selection';
import { ViewerInterop } from '../../viewer/viewer-interop';

export function StructureSelectionFromViewer(viewerInterop: ViewerInterop, dnatcofication: Dnatcofication): StructureSelection {
    if (viewerInterop.ready()) {
        const modelNumber = viewerInterop.api.query('current-model-number');
        const modelIndex = dnatcofication.data.structures[0].models.findIndex((x) => x.num === modelNumber);

        const currentFilter = viewerInterop.api.query('current-filter');
        const chain = modelIndex !== InvalidModelIndex ? filterToChain(dnatcofication, modelIndex, currentFilter) : InvalidChain;

        const steps = [] as StructureSelection['steps'];
        const residues = [] as StructureSelection['residues'];
        const atoms = [] as StructureSelection['atoms'];
        const basePairs = [] as StructureSelection['basePairs'];

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
            } else if (sel.type === 'base-pair') {
                const bp = BasePairsMapper.findByResidues(
                    dnatcofication,
                    sel.asymId1, sel.seqId1, sel.insCode1,
                    sel.asymId2, sel.seqId2, sel.insCode2,
                    sel.altId1, sel.altId2
                );
                if (bp)
                    basePairs.push(bp.id);
            }
        }

        return { modelIndex, chain, steps, residues, atoms, basePairs };
    } else
        return EmptyStructureSelection(dnatcofication);
}

export type SelectedPieces = {
    steps: StructureSelection['steps'],
    residues: StructureSelection['residues'],
    atoms: StructureSelection['atoms'],
    basePairs: StructureSelection['basePairs'],
    reconstruct: boolean,
}
export function SelectedPieces(steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'], basePairs: SelectedPieces['basePairs'], reconstruct: boolean): SelectedPieces {
    return { steps, residues, atoms, basePairs, reconstruct };
}
export const EmptySelectionPieces: SelectedPieces = {
    steps: [],
    residues: [],
    atoms: [],
    basePairs: [],
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
