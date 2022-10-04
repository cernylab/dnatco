import { ComboBox } from '../common/combo-box';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Chain, Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';

export function listOfChains(modelNum: number|undefined, structure: Structure) {
    let models;
    if (modelNum === undefined)
        models = structure.models;
    else {
        const m = structure.models.find(m => m.num === modelNum);
        models = m ? [m] : [];
    }

    const seenChains = new Set<string>();
    const options: ComboBox.Option[] = [];
    for (const m of models) {
        for (const chain of m.chains) {
            if (Chain.isNAChain(chain) && !seenChains.has(chain.name))
                options.push({ value: chain.name, caption: `Auth: ${chain.authName}, Cif: ${chain.name}` });
        }
    }

    return options;
}

export function makeStepSelection(dnatcofication: Dnatcofication, stepName: string): { prev?: string, current: string, next?: string }|undefined {
    const stepId = StepsMapper.byName(dnatcofication, stepName)?.id ?? -1;
    if (stepId === -1)
        return undefined;

    const { previous, next } = StepsMapper.previousNextById(dnatcofication, stepId);
    const prevName = previous === -1 ? undefined : StepsMapper.byId(dnatcofication, previous).name;
    const nextName = next === -1 ? undefined : StepsMapper.byId(dnatcofication, next).name;

    return { prev: prevName, current: stepName, next: nextName };
}

export function valueToSemaphore(v: number, greenValue: number, redValue: number) {
    const Min = 0.0
    const Half = 0.5;
    const Max = redValue - greenValue;

    let normalized = (v - Min) / Max;
    if (Max < Min)
        normalized = 1.0 + normalized;

    if (normalized > 1.0)
        normalized = 1.0;
    else if (normalized < 0.0)
        normalized = 0.0;

    const r = Math.round(255 * (2 * normalized < 1 ? 2 * normalized : 1));
    const g = Math.round(255 * (1 - 2 * (normalized - Half > 0 ? normalized - Half : 0)));

    return { r, g, b: 0 };
}
