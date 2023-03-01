import { Subject } from 'rxjs';
import { filterToChain }  from './util';
import { ViewerInterop } from '../../viewer/viewer-interop';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Model } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';

export const InvalidModelIndex = -1;
export const InvalidChain = '';
export const InvalidStepId = -1;

export type StructureSelection = {
    modelIndex: number,
    chain: string,
    stepId: number,
}
export function StructureSelection(viewerInterop: ViewerInterop, dnatcofication: Dnatcofication): StructureSelection {
    if (viewerInterop.ready()) {
        const stru = dnatcofication.data.structures[0];

        const modelNum = viewerInterop.api.query('current-model-number').num;
        const modelIndex = modelNum !== -1 ? Model.modelNameToIndex(modelNum.toString(), stru) : InvalidModelIndex;

        const currentFilter = viewerInterop.api.query('current-filter').filter;
        const chain = modelIndex !== InvalidModelIndex ? filterToChain(dnatcofication, modelIndex, currentFilter) : InvalidChain;

        if (chain === InvalidChain)
            return { modelIndex, chain, stepId: InvalidStepId };

        const stepName = viewerInterop.api.query('selected-step').selected?.name
        const step = stepName ? StepsMapper.byName(dnatcofication, stepName) : void 0;
        if (step) {
            const stepId = StepsMapper.idToIndex(dnatcofication, step.id);
            return { modelIndex, chain, stepId };
        } else
            return { modelIndex, chain, stepId: InvalidStepId };
    } else
        return EmptyStructureSelection(dnatcofication);
}

export function EmptyStructureSelection(d: Dnatcofication): StructureSelection {
    return {
        modelIndex: d.data.structures[0].models.length === 1 ? 0 : InvalidModelIndex,
        chain: InvalidChain,
        stepId: InvalidStepId,
    };
}

export type StepSwitcher = (stepId: number, d: Dnatcofication, vi: ViewerInterop, customNtCSet: string) => Promise<void>;

export type StructureSelectionSwitching = {
    switchModel: (modelIndex: number) => void,
    switchChain: (chain: string) => void,
    switchStepId: (stepId: number) => void,
    events: {
        modelSwitched: Subject<StructureSelection>,
        chainSwitched: Subject<StructureSelection>,
    },
}
