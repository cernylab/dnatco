import * as React from 'react';
import { ComboBox } from './common/combo-box';
import { PushButton } from './common/push-button';
import { ShadowedBox } from './common/shadowed-box';
import { SpinBox } from './common/spin-box';
import { NtC } from '../dnatco/ntc';
import { Search } from '../search/search';

type Redundacy = 'non-redundant' | 'all';

const MaxAllowedCount  = 500;
const RedundancyOptions = [
    { value: 'non-redundant', caption: 'Non-redundant' },
    { value: 'all', caption: 'All' },
];
const NtCOptions = NtC.Conformers.map(cfrm => { return { value: cfrm, caption: cfrm } });

interface State {
    largeStructures: boolean;
    maxCount: number;
    NtC: NtC.Conformer;
    redundancy: Redundacy;
}
export class SearchConformers extends React.Component<SearchConformers.Props, State> {
    constructor(props: SearchConformers.Props) {
        super(props);

        this.state = {
            largeStructures: props.initial?.largeStructures ?? false,
            maxCount: props.initial?.maxCount ?? 200,
            NtC: props.initial?.NtC ?? 'AA00',
            redundancy: (props.initial?.redundant ? 'all' : 'non-redundant') ?? 'non-redundant',
        };
    }

    render() {
        return (
            <div style={{ display: 'flex' }}>
                <ShadowedBox>
                    <div className='rdo-offset' style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
                        Return up to{'\u00A0'}
                        <SpinBox
                            min={1}
                            max={MaxAllowedCount}
                            step={1}
                            onChange={v => this.setState({ ...this.state, maxCount: v })}
                            value={this.state.maxCount}
                        />{'\u00A0'}
                        random{'\u00A0'}
                        <ComboBox
                            options={NtCOptions}
                            value={this.state.NtC}
                            onChange={v => this.setState({ ...this.state, NtC: v })}
                        />{'\u00A0'}
                        steps
                        in{'\u00A0'}
                        <ComboBox
                            options={RedundancyOptions}
                            value={this.state.redundancy}
                            onChange={v => this.setState({ ...this.state, redundancy: v as Redundacy })}
                        />{'\u00A0'}
                        PDB structures
                        (<input
                            id='search-large-structures'
                            className='rdo-input-checkbox'
                            type='checkbox'
                            checked={this.state.largeStructures}
                            onChange={e => this.setState({ ...this.state, largeStructures: e.currentTarget.checked })}
                         />
                         <label htmlFor='search-large-structures'>include large structures</label>)
                        {'\u00A0'}
                        <PushButton
                            caption='Search'
                            onClick={() => {
                                const criteria = {
                                    NtC: this.state.NtC,
                                    maxCount: this.state.maxCount,
                                    redundant: this.state.redundancy === 'all',
                                    largeStructures: this.state.largeStructures,
                                };
                                this.props.onDoSearch(criteria);
                            }}
                        />
                    </div>
                </ShadowedBox>
            </div>
        )
    }
}

export namespace SearchConformers {
    export interface Props {
        onDoSearch: (criteria: Search.Criteria) => void;
        initial?: Search.Criteria;
    }
}
