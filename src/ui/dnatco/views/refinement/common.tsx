import React from 'react';
import { Constants } from '../../constants';
import { makeStepSelection } from '../../util';
import { View } from '../../views/view';
import { ComboBox } from '../../../common/combo-box';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { NtC } from '../../../../dnatco/ntc';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { ViewerInterop, ViewerApi } from '../../../../viewer/viewer-interop';

const NtCSelectorOptions: ComboBox.Option[] = (() => {
    return NtC.Classes.map(NtC => ({ caption: NtC, value: NtC }));
})();

export namespace Refinement {
    export interface Props extends View.Props {
        onCustomNtCSetChanged: (set: string) => void;
        selectedCustomNtCSet: string;
    }

    export class NtCSelector extends React.Component<NtCSelector.Props> {
        render() {
            return (
                <ComboBox
                    options={NtCSelectorOptions}
                    value={this.props.value}
                    onChange={v => this.props.onChanged(v)}
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

    export async function switchStep(stepId: number, d: Dnatcofication, vi: ViewerInterop, customNtCSet: string) {
        const selection = makeStepSelection(d, stepId);
        const step = StepsMapper.byId(d, selection.current.id);

        let NtC;
        if (customNtCSet !== '') {
            const custom = d.customNtCs.getCustomNtC(customNtCSet, step.name);
            NtC = custom ?? step.closestNtC;
        } else
            NtC = step.closestNtC;

        await vi.api.command(
            ViewerApi.Commands.SelectStep(
                ViewerApi.Payloads.StepSelection(selection.current.name, { NtC, color: Constants.StepColor }),
                void 0,
                void 0
            )
        );
    }
}
