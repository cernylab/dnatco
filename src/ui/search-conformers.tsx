import * as React from 'react';
import { NamedList, NamedListItem } from './common/named-list';
import { PushButton } from './common/push-button';
import { SpinBox } from './common/spin-box';
import { NtC } from '../dnatco/ntc';
import { Search } from '../remote/search';
import {RadixComboBox} from "./common/radix-combo-box";

type Redundacy = 'non-redundant' | 'all';

const MaxAllowedCount  = 500;
const RedundancyOptions = [
    { value: 'non-redundant', caption: 'Non-redundant' },
    { value: 'all', caption: 'All' },
];

const TypeOfNAOptions = [
    { value: 'DNA', caption: 'DNA' },
    { value: 'RNA', caption: 'RNA' },
    { value: 'DNA / RNA', caption: 'DNA / RNA' },
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
            largeStructures: false,
            maxCount: 200,
            NtC: 'AA00',
            redundancy: 'non-redundant',
        };
    }

    render() {
        return (
                <div className='mt-7'>
                    <NamedList sizing='min-content' rowSpacing='half'>
                        <NamedListItem name='Conformation'>
                            <RadixComboBox
                                options={NtCOptions}
                                value={this.state.NtC}
                                onChange={v => this.setState({ ...this.state, NtC: v as NtC.Class })}
                                triggerStyle={"inline-flex items-center justify-between rounded-standard h-auto gap-1 m-auto p-1 outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-80 w-full px-4"}
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
                            <RadixComboBox
                                options={RedundancyOptions}
                                value={this.state.redundancy}
                                onChange={v => this.setState({ ...this.state, redundancy: v as Redundacy })}
                                triggerStyle={"inline-flex items-center justify-between rounded-standard h-auto gap-1 m-auto p-1 outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-80 w-full min-w-[150px] whitespace-nowrap px-4"}
                            />
                        </NamedListItem>
                        <div className='hidden'>
                            <NamedListItem name='Type of NA'>
                                <RadixComboBox
                                    options={TypeOfNAOptions}
                                    value={this.state.redundancy}
                                    onChange={v => this.setState({ ...this.state, redundancy: v as Redundacy })}
                                    triggerAddStyle={"min-w-[100px]"}
                                />
                            </NamedListItem>
                        </div>
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
        )
    }
}

export namespace SearchConformers {
    export interface Props {
        onDoSearch: (criteria: Search.Criteria) => void;
    }
}
