import React from 'react';
import { Refinement } from './common';
import { View } from '../view';
import { CheckBox } from '../../../common/check-box';
import { ComboBox } from '../../../common/combo-box';
import { PushButton } from '../../../common/push-button';
import { Net } from '../../../../browser-util/net';
import { Mmb } from '../../../../refine/mmb';

interface State {
    includeSequences: boolean;
}
export class MmbCommandsFile extends View<Refinement.Props, State> {
    constructor(props: Refinement.Props) {
        super(props);

        this.state = {
            includeSequences: false,
        };
    }
    render() {
        const lines = Mmb.commands(this.props.dnatcofication, this.props.selectedCustomNtCSet, this.state.includeSequences);

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <div className='rdo-secondary-caption'>MMB commands file</div>

                    <div style={{ display: 'flex', justifyContent: 'center'}}>
                        Note that this is not a complete MMB commands file but just an excerpt that instructs MMB to apply NtCs to the structure
                    </div>

                    <div className='rdo-line-spacer' />

                    <div style={{
                        alignItems: 'center',
                        display: 'grid',
                        gap: 'var(--h-gap)',
                        gridTemplateColumns:' auto auto auto auto',
                        justifyContent: 'center',
                    }}>
                        <div>NtC set:</div>
                        <ComboBox
                            options={Refinement.ntcSetsOptions(this.props.dnatcofication.customNtCs)}
                            value={this.props.selectedCustomNtCSet}
                            onChange={(v) => this.props.onCustomNtCSetChanged(v)}
                        />
                        <CheckBox
                            caption='Add sequence definitions to the commands file'
                            checked={this.state.includeSequences}
                            onChanged={checked => this.setState({ ...this.state, includeSequences: checked })}
                        />
                        <PushButton
                            caption='Download'
                            onClick={() => {
                                Net.serveFile('text/plain', lines.join('\n'), `${this.props.dnatcofication.identifyingName}_MMB_commands.txt`);
                            }}
                        />
                    </div>
                </div>
                <div className='rdo-scroll-vertically-with-scrollbar'>
                    {lines.map((l, idx) => <div className='rdo-monospace' key={idx}>{l}</div>)}
                </div>
            </div>
        );
    }
}
