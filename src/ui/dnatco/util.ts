import { InvalidModelIndex, InvalidStepId } from './structure-selection';
import { Cif } from '../../cif';
import { Category, Schema } from '../../cif/categories';
import { ComboBox } from '../common/combo-box';
import { DynamicTable } from '../common/dynamic-table';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Chain, Structure } from '../../dnatco/structure';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { Rgb } from '../util';
import { capitalize, clamp } from '../../util';
import { Filters } from 'viewer-filters';

const Half = 0.5;
function semaphoreColor(v: number): Rgb {
    const r = Math.round(255 * (2 * v < 1 ? 2 * v : 1));
    const g = Math.round(255 * (1 - 2 * (v - Half > 0 ? v - Half : 0)));

    return { r, g, b: 0 };
}

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

export function getCifValue<S extends Schema.Schema, K extends keyof S>(d: Dnatcofication, category: Category<S>, column: K, row = 0): S[K]['T'] {
    if (d.hasTable(category)) {
        const col = d.table(category)[column];
        if (Cif.Column.hasValues(col))
            return Cif.Column.value(col, row);
        return void 0;
    } else
        return void 0;
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

export function niceCifDate(date: Schema.CifDate) {
    if (!date)
        return 'N/A';
    return niceDate(date.year, date.month, date.day);
}

export function niceDate(year: number, month: number, day: number) {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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

export function valueToSemaphore(v: number, greenValue: number, redValue: number) {
    const reverse = redValue < greenValue;
    const Inv = reverse ? 1.0 : 0.0;
    const Min = reverse ? redValue : greenValue;
    const Span = redValue - greenValue;

    const normalized = clamp(Inv + (v - Min) / Span, 0.0, 1.0);

    return semaphoreColor(normalized);
}

export namespace GappedSemaphore {
    export type Segment = { from: number, to: number };
    export type Mapping = { mappedFrom: number, mappedTo: number, segment: Segment }[];

    export function makeMapping(segments: Segment[]) {
        const range = segments.map((seg) => seg.to - seg.from).reduce((p, c) => p + c, 0);

        const mapping: Mapping = [];
        let lastMappedFrom = 0.0;
        for (const seg of segments) {
            const relWidth = (seg.to - seg.from) / range;
            const to = lastMappedFrom + relWidth;

            mapping.push({ mappedFrom: lastMappedFrom, mappedTo: to, segment: seg });
            lastMappedFrom = to;
        }

        return mapping;
    }

    export function toSemaphore(v: number, greenValue: number, redValue: number, mapping: Mapping) {
        // Clamp the value to the given range as if we had normal "non-gapped" semaphore
        const reverse = redValue < greenValue;
        const Inv = reverse ? 1.0 : 0.0;
        const Min = reverse ? redValue : greenValue;
        const Span = redValue - greenValue;
        const normalized = clamp(Inv + (v - Min) / Span, 0.0, 1.0);

        // Find the mapped segment
        const ms = normalized === 1.0
            ? mapping[mapping.length - 1]
            : mapping.find((ms) => normalized >= ms.mappedFrom && normalized < ms.mappedTo);
        if (!ms)
            throw new Error('No mapping for value ' + normalized);

        // Remap back to the segment range
        const sv = (normalized - ms.mappedFrom) * (ms.segment.to - ms.segment.from) / (ms.mappedTo - ms.mappedFrom) + ms.segment.from;

        return semaphoreColor(sv);
    }
}
