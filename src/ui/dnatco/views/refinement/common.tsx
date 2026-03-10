import React from 'react';
import { Colors } from '../../colors';
import { SelectedPieces } from '../../structure-selection';
import { makeStepSelection } from '../../util';
import { View } from '../../views/view';
import { ComboBox } from '../../../common/combo-box';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { CustomNtCs } from '../../../../dnatco/custom-ntcs';
import { NtC } from '../../../../dnatco/ntc';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { InvalidStepId } from '../../../../util/structure-selection';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

const NtCSelectorOptions: ComboBox.Option[] = (() => {
    return NtC.Classes.map(NtC => ({ caption: NtC, value: NtC }));
})();

export function getNtC(d: Dnatcofication, step: Step, set: string) {
    return set === '' ? step.closestNtC : d.customNtCs.getCustomNtC(set, step.name) ?? step.closestNtC;
}

export namespace Refinement {
    export interface Props extends View.Props {
        onCustomNtCSetChanged: (set: string) => void;
        selectedCustomNtCSet: string;
    }

    export class NtCSelector extends React.Component<NtCSelector.Props> {
        shouldComponentUpdate(nextProps: Readonly<NtCSelector.Props>): boolean {
            return this.props.value !== nextProps.value;
        }

        render() {
            return (
                <ComboBox
                    options={NtCSelectorOptions}
                    value={this.props.value}
                    onChange={v => this.props.onChanged(v as NtC.ValidClass)}
                />
            );
        }
    }
    export namespace NtCSelector {
        export interface Props {
            value: NtC.ValidClass;
            onChanged: (v: NtC.ValidClass) => void;
        }
    }

    export function ntcSetsOptions(customNtCs: CustomNtCs) {
        return [
            { caption: '(Computed)', value: 'default_value' },
            ...customNtCs.sets().map(s => ({ caption: s, value: s }))
        ];
    }

    export async function selectionDisplayer(pieces: SelectedPieces, d: Dnatcofication, vi: ViewerInterop, customNtCSet: string) {
        if (pieces.reconstruct)
            await vi.api.command(ViewerApi.Commands.DeselectStructures());

        const selected = [];
        for (const sid of pieces.steps) {
            const selection = makeStepSelection(d, sid)
            const currStep = StepsMapper.byId(d, selection.current.id);
            const prevStep = selection.previous ? StepsMapper.byId(d, selection.previous.id) : void 0;
            const nextStep = selection.next ? StepsMapper.byId(d, selection.next.id) : void 0;

            const currNtC = getNtC(d, currStep, customNtCSet);
            const prevNtC = prevStep ? getNtC(d, prevStep, customNtCSet) : void 0;
            const nextNtC = nextStep ? getNtC(d, nextStep, customNtCSet) : void 0;

            const step = ViewerApi.Commands.StepSelection(
                ViewerApi.Payloads.StepSelection(selection.current.name, { NtC: currNtC, color: Colors.CurrentStep() }),
                prevNtC ? ViewerApi.Payloads.StepSelection(selection.previous!.name, { NtC: prevNtC, color: Colors.PreviousStep() }) : void 0,
                nextNtC ? ViewerApi.Payloads.StepSelection(selection.next!.name, { NtC: nextNtC, color: Colors.NextStep() }) : void 0
            );
            selected.push(step);
        }

        await vi.api.command(ViewerApi.Commands.SelectStructures(selected));
    }

    export function selectionMaker(
        newStepId: SelectedPieces['steps'][0], newResidue: SelectedPieces['residues'][0], newAtom: SelectedPieces['atoms'][0],
        steps: number[], residues: SelectedPieces['residues'], atoms: SelectedPieces['atoms'],
        d: Dnatcofication
    ): SelectedPieces {
        return {
            steps: newStepId === InvalidStepId ? [] : [newStepId],
            residues: [],
            atoms: [],
            basePairs: [],
            reconstruct: !(steps[0] === newStepId && steps.length === 1)
        };
    }
}
