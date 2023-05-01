import React from 'react';
import { listOfChains, listOfModels } from '../util';
import { InvalidChain, InvalidModelIndex, InvalidStepId, StructureSelection, StructureSelectionSwitching } from '../structure-selection';
import { ComboBox } from '../../common/combo-box';
import { WithSubscriptions } from '../../service/with-subscriptions';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../dnatco/steps-mapper';
import { toComboBoxOptions } from '../../util';

function chainOptions(modelIndex: number, d: Dnatcofication) {
    if (modelIndex === InvalidModelIndex)
        return [{ caption: 'All models selected - cannot filter by chains', value: InvalidChain }];

    const opts = [
        { caption: 'All', value: InvalidChain },
        ...listOfChains(modelIndex, d.data.structures[0], d.data.entityKinds[modelIndex]),
    ];
    return opts;
}

export function modelOptions(d: Dnatcofication, hideAllModels = false) {
    if (d.data.structures[0].models.length === 1)
        return listOfModels(d.data.structures[0]);

    const opts = [];
    if (!hideAllModels)
        opts.push({ name: 'All', index: InvalidModelIndex });

    return [ ...opts, ...listOfModels(d.data.structures[0]) ];
}

type StepValue = { name: string, id: number };
type StepOption = {
    caption: string;
    value: StepValue;
};
function stepsOptions(modelIndex: number, chain: string, d: Dnatcofication) {
    const _chain = chain !== InvalidChain ? chain : void 0;
    const _modelIndex = modelIndex !== InvalidModelIndex ? modelIndex : void 0;

    const opts: StepOption[] = [
        { caption: '-', value: { name: '', id: InvalidStepId } }
    ];
    for (const s of StepsMapper.segment(d, _modelIndex, _chain))
        opts.push({ caption: s.name, value: { name: s.name, id: s.id } });

    return opts;
}

export class ChainSelect extends WithSubscriptions<ChainSelect.Props, { modelIndex: number, chain: string }> {
    constructor(props: ChainSelect.Props) {
        super(props);

        this.state = {
            modelIndex: props.structureSelection.modelIndex,
            chain: props.structureSelection.chain,
        };
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.chainSwitched, (sel) => this.setState({ ...this.state, modelIndex: sel.modelIndex, chain: sel.chain }));
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <ComboBox
                options={toComboBoxOptions(chainOptions(this.state.modelIndex, this.props.dnatcofication), o => ({ caption: o.caption, value: o.value }))}
                value={this.state.chain}
                onChange={v => {
                    if (v === this.state.chain)
                        return;
                    this.props.switching.switchChain(v);
                }}
                sizing='auto'
            />
        );
    }
}
export namespace ChainSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        switching: StructureSelectionSwitching;
    }
}

export class ModelSelect extends WithSubscriptions<ModelSelect.Props, { modelIndex: number }> {
    constructor(props: ModelSelect.Props) {
        super(props);

        this.state = { modelIndex: props.structureSelection.modelIndex };
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, (sel) => this.setState({ ...this.state, modelIndex: sel.modelIndex }));
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <ComboBox
                options={toComboBoxOptions(modelOptions(this.props.dnatcofication, this.props.hideAllModelsOption ?? false), o => ({ caption: o.name, value: o.index.toString() }))}
                value={this.state.modelIndex.toString()}
                onChange={v => {
                    const modelIndex = parseInt(v);
                    if (modelIndex === this.state.modelIndex)
                        return;
                    this.props.switching.switchModel(modelIndex);
                }}
                sizing='auto'
            />
        );
    }
}
export namespace ModelSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        switching: StructureSelectionSwitching;
        hideAllModelsOption?: boolean;
    }
}

export class StepSelect extends WithSubscriptions<StepSelect.Props, { modelIndex: number, chain: string, stepId: number }> {
    constructor(props: StepSelect.Props) {
        super(props);

        this.state = {
            modelIndex: props.structureSelection.modelIndex,
            chain: props.structureSelection.chain,
            stepId: props.structureSelection.steps[0] ?? InvalidStepId,
        };
    }

    update = (sel: StructureSelection) => {
        this.setState({
            ...this.state,
            modelIndex: sel.modelIndex,
            chain: sel.chain,
            stepId: sel.steps[0] ?? InvalidStepId
        });
    }

    componentDidMount() {
        this.subscribe(this.props.switching.events.modelSwitched, (sel) => this.update(sel));
        this.subscribe(this.props.switching.events.chainSwitched, (sel) => this.update(sel));
        this.subscribe(this.props.switching.events.selectionChanged, (sel) => this.update(sel));
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        return (
            <ComboBox
                value={this.state.stepId.toString()}
                options={toComboBoxOptions(stepsOptions(this.state.modelIndex, this.state.chain, this.props.dnatcofication), (o: StepOption) => ({ caption: o.caption, value: o.value.id.toString() }))}
                onChange={v => {
                    const stepId = parseInt(v);
                    if (stepId === this.props.structureSelection.steps[0])
                        return;
                    this.props.onChange(stepId);
                }}
                sizing='auto'
            />
        );
    }
}
export namespace StepSelect {
    export interface Props {
        dnatcofication: Dnatcofication;
        structureSelection: StructureSelection;
        switching: StructureSelectionSwitching;
        onChange: (stepId: number) => void;
    }
}
