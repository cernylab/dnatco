import { InvalidModelIndex, InvalidStepId } from './structure-selection';
import { ComboBox } from '../common/combo-box';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Chain, Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { clamp } from '../../util';
import { Filters } from 'viewer-filters';

export type PrevCurrentNextStepSelection = {
    previous?: { id: number, name: string },
    current: { id: number, name: string },
    next?: { id: number, name: string },
}

export function filterToChain(dnatcofication: Dnatcofication, modelIndex: number, filter: Filters.All) {
    if (filter.kind === 'empty')
        return ''; // Empty string indicates all chains

    const chain = filter.slices.at(0)?.chain ?? '';
    const found = dnatcofication.data.structures[0].models[modelIndex].chains.find(ch => ch.name === chain);

    return found ? chain : '';
}

export function listOfChains(modelIndex: number, structure: Structure) {
    if (modelIndex === InvalidModelIndex)
        return [];

    const model = structure.models[modelIndex];

    const seenChains = new Set<string>();
    const options: ComboBox.Option[] = [];
    for (const chain of model.chains) {
        if (Chain.isNAChain(chain) && !seenChains.has(chain.name))
            options.push({ value: chain.name, caption: `Auth: ${chain.authName}, Cif: ${chain.name}` });
    }

    return options;
}

export function listOfModels(structure: Structure) {
    const list: { name: string, index: number }[] = [];

    let index = 0;
    for (const model of structure.models) {
        list.push({ name: model.num.toString(), index });
        index++;
    }

    list.sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return list;
}

export function makeStepSelection(dnatcofication: Dnatcofication, stepId: number): PrevCurrentNextStepSelection {
    const { previousId, nextId } = StepsMapper.previousNextById(dnatcofication, stepId);
    const prevStep = previousId === InvalidStepId ? undefined : StepsMapper.byId(dnatcofication, previousId);
    const nextStep = nextId === InvalidStepId ? undefined : StepsMapper.byId(dnatcofication, nextId);

    return {
        previous: prevStep ? { id: previousId, name: prevStep.name } : void 0,
        current: { id: stepId, name: StepsMapper.byId(dnatcofication, stepId).name },
        next: nextStep ? { id: nextId, name: nextStep.name } : void 0,
    };
}

export function valueToSemaphore(v: number, greenValue: number, redValue: number) {
    const reverse = redValue < greenValue;
    const Inv = reverse ? 1.0 : 0.0;
    const Min = reverse ? redValue : greenValue;
    const Span = redValue - greenValue;

    const Half = 0.5;
    const normalized = clamp(Inv + (v - Min) / Span, 0.0, 1.0);

    const r = Math.round(255 * (2 * normalized < 1 ? 2 * normalized : 1));
    const g = Math.round(255 * (1 - 2 * (normalized - Half > 0 ? normalized - Half : 0)));

    return { r, g, b: 0 };
}
