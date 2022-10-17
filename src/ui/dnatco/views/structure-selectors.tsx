import React from 'react';
import { listOfChains, listOfModels } from '../util';
import { InvalidChain, InvalidModelIndex, InvalidStepId, StructureSelection } from '../structure-selection';
import { ComboBox } from '../../common/combo-box';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../dnatco/steps-mapper';
import { toComboBoxOptions } from '../../util';

function chainOptions(sel: StructureSelection, d: Dnatcofication) {
    if (sel.modelIndex === InvalidModelIndex)
        return [{ caption: 'All models selected - cannot filter by chains', value: InvalidChain }];

    const opts = [
        { caption: 'All', value: InvalidChain },
        ...listOfChains(sel.modelIndex, d.data.structures[0]),
    ];
    return opts;
}

function modelOptions(d: Dnatcofication) {
    if (d.data.structures[0].models.length === 1)
        return listOfModels(d.data.structures[0]);

    const opts = [
        { name: 'All', index: InvalidModelIndex },
        ...listOfModels(d.data.structures[0]),
    ];
    return opts;
}

type StepValue = { name: string, id: number };
type StepOption = {
    caption: string;
    value: StepValue;
};
function stepsOptions(sel: StructureSelection, d: Dnatcofication) {
    const chain = sel.chain !== InvalidChain ? sel.chain : void 0;
    const modelIndex = sel.modelIndex !== InvalidModelIndex ? sel.modelIndex : void 0;

    const opts: StepOption[] = [
        { caption: '-', value: { name: '', id: InvalidStepId } }
    ];
    for (const s of StepsMapper.segment(d, modelIndex, chain))
        opts.push({ caption: s.name, value: { name: s.name, id: s.id } });

    return opts;
}

export class ChainSelect extends React.Component<ChainSelect.Props> {
    render() {
        return (
            <ComboBox
                options={toComboBoxOptions(chainOptions(this.props.structureSelection, this.props.dnatcofication), o => ({ caption: o.caption, value: o.value }))}
                value={this.props.structureSelection.chain}
                onChange={v => {
                    if (v === this.props.structureSelection.chain)
                        return;
                    this.props.onChange(v);
                }}
            />
        );
    }
}
export namespace ChainSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        onChange: (chain: string) => void;
    }
}

export class ModelSelect extends React.Component<ModelSelect.Props> {
    render() {
        return (
            <ComboBox
                options={toComboBoxOptions(modelOptions(this.props.dnatcofication), o => ({ caption: o.name, value: o.index.toString() }))}
                value={this.props.structureSelection.modelIndex.toString()}
                onChange={v => {
                    const modelIndex = parseInt(v);
                    if (modelIndex === this.props.structureSelection.modelIndex)
                        return;
                    this.props.onChange(modelIndex);
                }}
            />
        );
    }
}
export namespace ModelSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        onChange: (modelIndex: number) => void;
    }
}

export class StepSelect extends React.Component<StepSelect.Props> {
    render() {
        return (
            <ComboBox
                value={this.props.structureSelection.stepId === InvalidStepId ? InvalidStepId.toString() : this.props.structureSelection.stepId.toString()}
                options={toComboBoxOptions(stepsOptions(this.props.structureSelection, this.props.dnatcofication), (o: StepOption) => ({ caption: o.caption, value: o.value.id.toString() }))}
                onChange={v => {
                    const stepId = parseInt(v);
                    if (stepId === this.props.structureSelection.stepId)
                        return;
                    this.props.onChange(stepId);
                }}
            />
        );
    }
}
export namespace StepSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        onChange: (stepId: number) => void;
    }
}
