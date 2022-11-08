import React from 'react';
import { ComboBox } from '../../../common/combo-box';
import { InputDialog } from '../../../common/input-dialog';
import { IconTextButton } from '../../../common/push-button';
import { WithSubscriptions } from '../../../service/with-subscriptions';
import { CustomNtCs } from '../../../../dnatco/custom-ntcs';
import { Empty } from '../../../../util';

function setsOptions(custom: CustomNtCs): ComboBox.Option[] {
    return custom.sets().map(name => ({ value: name, caption: name }));
}

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
        return (
            <div>
                <div>Sets of custom NtC</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 8em 8em 8em 1fr',
                    gap: 'var(--h-gap)',
                    alignItems: 'center',
                }}>
                    Set:
                    <ComboBox
                        options={setsOptions(this.props.customNtCs)}
                        value={this.props.selectedSet}
                        onChange={v => this.props.onSetChanged(v)}
                    />
                    <IconTextButton
                        caption='Add'
                        src=''
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
                        src=''
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
                        src=''
                        onClick={() => {
                            if (this.props.selectedSet !== '') {
                                this.props.customNtCs.deleteSet(this.props.selectedSet);
                            }
                        }}
                    />
                </div>
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
