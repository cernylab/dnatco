import * as React from 'react';
import { CheckBox } from './common/check-box';
import { ComboBox } from './common/combo-box';
import { NamedList, NamedListItem } from './common/named-list';
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
const NtCOptions = NtC.Classes.map(cls => { return { value: cls, caption: cls } });

interface State {
    largeStructures: boolean;
    maxCount: number;
    NtC: NtC.Class;
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
            <ShadowedBox>
                <div className='rdo-offset'>
                    <NamedList sizing='min-content' rowSpacing='half'>
                        <NamedListItem name='Conformation'>
                            <ComboBox
                                options={NtCOptions}
                                value={this.state.NtC}
                                onChange={v => this.setState({ ...this.state, NtC: v })}
                                sizing='maximum-available'
                            />
                        </NamedListItem>
                        <NamedListItem name='Maximum number of results'>
                            <SpinBox
                                min={1}
                                max={MaxAllowedCount}
                                step={1}
                                onChange={v => this.setState({ ...this.state, maxCount: v })}
                                value={this.state.maxCount}
                                sizing='maximum-available'
                            />
                        </NamedListItem>
                        <NamedListItem name='PDB structure'>
                            <ComboBox
                                options={RedundancyOptions}
                                value={this.state.redundancy}
                                onChange={v => this.setState({ ...this.state, redundancy: v as Redundacy })}
                                sizing='maximum-available'
                            />
                        </NamedListItem>
                        <NamedListItem name='Include large structures'>
                            <CheckBox
                                checked={this.state.largeStructures}
                                onChanged={checked => this.setState({ ...this.state, largeStructures: checked })}
                                caption='Include large structures'
                            />
                        </NamedListItem>
                    </NamedList>
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
        )
    }
}

export namespace SearchConformers {
    export interface Props {
        onDoSearch: (criteria: Search.Criteria) => void;
        initial?: Search.Criteria;
    }
}
