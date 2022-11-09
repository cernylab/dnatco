import React from 'react';
import { Refinement } from './common';
import { ComboBox } from '../../../common/combo-box';
import { InputDialog } from '../../../common/input-dialog';
import { IconTextButton } from '../../../common/push-button';
import { WithSubscriptions } from '../../../service/with-subscriptions';
import { CustomNtCs } from '../../../../dnatco/custom-ntcs';
import { GlobalConfig } from '../../../../global-config';
import { Empty } from '../../../../util';
import 'assets/imgs/plus.svg';
import 'assets/imgs/reload.svg';
import 'assets/imgs/x.svg';

export class CustomNtCSets extends WithSubscriptions<CustomNtCSets.Props, Empty> {
    constructor(props: CustomNtCSets.Props) {
        super(props);
    }

    componentDidMount() {
        this.subscribe(
            this.props.customNtCs.events.changed,
            () => this.forceUpdate()
        );
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 6em 6em 6em 1fr',
                gap: 'var(--h-gap)',
                alignItems: 'center',
            }}>
                <div className='rdo-named-list-name'>Sets of custom NtC</div>
                <ComboBox
                    options={Refinement.ntcSetsOptions(this.props.customNtCs)}
                    value={this.props.selectedSet}
                    onChange={v => this.props.onSetChanged(v)}
                />
                <IconTextButton
                    caption='Add'
                    src={`${prefix}/imgs/plus.svg`}
                    onClick={() => {
                        InputDialog.create({
                            caption: 'Name of the new set',
                            validator: v  => {
                                if (v === '')
                                    return 'Set must have a name';
                                return this.props.customNtCs.exists(v) ? `Set named ${v} already exists` : void 0;
                            },
                            onAccepted: v => {
                                this.props.customNtCs.addSet(v);
                                this.props.onSetChanged(v);
                            }
                        });
                    }}
                />
                <IconTextButton
                    caption='Rename'
                    src={`${prefix}/imgs/reload.svg`}
                    onClick={() => {
                        InputDialog.create({
                            caption: `Set new name for set ${this.props.selectedSet}`,
                            validator: v  => {
                                if (v === '')
                                    return 'Set must have a name';
                                return this.props.customNtCs.exists(v) ? `Set named ${v} already exists` : void 0;
                            },
                            onAccepted: v => {
                                this.props.customNtCs.renameSet(this.props.selectedSet, v);
                                this.props.onSetChanged(v);
                            }
                        });
                    }}
                />
                <IconTextButton
                    caption='Delete'
                    src={`${prefix}/imgs/x.svg`}
                    onClick={() => {
                        if (this.props.selectedSet !== '') {
                            this.props.customNtCs.deleteSet(this.props.selectedSet);
                        }
                    }}
                />
            </div>
        );
    }
}

export namespace CustomNtCSets {
    export interface Props {
        customNtCs: CustomNtCs;
        selectedSet: string;
        onSetChanged: (set: string) => void;
    }
}
