import { ComboBox } from '../common/combo-box';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Chain, Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { capitalize } from '../../util';
import { DynamicTable } from '../../util/dynamic-table';
import { InvalidModelIndex, InvalidStepId } from '../../util/structure-selection';
import { Filters } from 'viewer-filters';

export type PrevCurrentNextStepSelection = {
    previous?: { id: number, name: string },
    current: { id: number, name: string },
    next?: { id: number, name: string },
}

export function axesMaximumHints(x: number[], y: number[], numberOfPoints: number, xHint: number, yHint: number): [xMax: number, yMax: number] {
    const xSorted = [...x].sort();

    // Get at least numberOfPoints points on x axis
    const xMax = xSorted.length < numberOfPoints
        ? xSorted[xSorted.length - 1] : xSorted[numberOfPoints - 1] < xHint
            ? xHint : xSorted[numberOfPoints - 1];

    let yMax = Number.MIN_SAFE_INTEGER;
    for (let idx = 0; idx < y.length; idx++) {
        const _x = x[idx];
        const _y = y[idx];

        if (_x <= xMax && _y > yMax)
            yMax = _y;
    }

    yMax = yMax < yHint ? yHint : yMax;

    return [ xMax, yMax ];
}

export function filterToChain(dnatcofication: Dnatcofication, modelIndex: number, filter: Filters.All) {
    if (filter.kind === 'empty')
        return ''; // Empty string indicates all chains

    const chain = filter.slices.at(0)?.chain ?? '';
    const found = dnatcofication.data.structures[0].models[modelIndex].chains.find(ch => ch.authName === chain);

    return found ? chain : '';
}

export function listOfChains(modelIndex: number, structure: Structure, entityKinds: Dnatcofication.EntityKinds) {
    if (modelIndex === InvalidModelIndex)
        return [];

    const model = structure.models[modelIndex];

    const seenChains = new Set<string>();
    const options: ComboBox.Option[] = [];
    for (const chain of model.chains) {
        const ek = entityKinds.get(chain.entityId) ?? 'other';
        if (Chain.isNAChain(ek) && !seenChains.has(chain.name))
            options.push({ value: chain.name, caption: `Auth: ${chain.authName}, Cif: ${chain.name} (${capitalize(ek)})` });
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

export function setDynamicTableModelColumns(oldModel: DynamicTable.Model, rowIdx: number, columns: DynamicTable.Column<any>[], tags: (string | undefined)[], newValues: (number | string)[], newElems: ((() => JSX.Element) | undefined)[]) {
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const col = columns[colIdx];
        const oldValue = oldModel.columns[colIdx]?.cells[rowIdx]?.data;
        if (oldValue !== undefined && oldValue === newValues[colIdx])
            col.cells.push(oldModel.columns[colIdx]!.cells[rowIdx]);
        else {
            const eg = newElems[colIdx];
            col.cells.push({
                data: newValues[colIdx],
                elem: eg ? eg() : void 0,
                tag: tags[colIdx],
            });
        }
    }
}
