import * as jsLLKA from 'jsllka';
import { Cif } from '../cif';
import { Category, Schema } from '../cif/categories';
import { ClassificationContext } from '../dnatco/classification-context';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { Step } from '../dnatco/step';

export namespace Common {
    export const MethodsWithCommonResolution = ['x-ray diffraction', 'neutron diffraction', 'fiber diffraction', 'electron crystallography', 'powder diffraction'];
    export const NA = 'N/A';
}

export function confalPercentile(confalScore: number) {
    return jsLLKA.LLKA.confalPercentile(confalScore, ClassificationContext.context());
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

export function niceCifDate(date: Schema.CifDate) {
    if (!date)
        return 'N/A';
    return niceDate(date.year, date.month, date.day);
}

export function niceDate(year: number, month: number, day: number) {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}


export function niceStepNameText(step: Step, showModelNum = false) {
    const SP = '\u00A0';

    const nice =
        step.base1 + SP +
        step.resNo1Auth + step.insCode1 +
        (step.altPos1 !== '' ? `(alt ${step.altPos1})` : '') +
        SP +
        step.base2 + SP +
        step.resNo2Auth + step.insCode2 +
        (step.altPos2 !== '' ? `(alt ${step.altPos2})` : '');

    return (showModelNum ? `M${step.model} ` : '') + nice;
}
