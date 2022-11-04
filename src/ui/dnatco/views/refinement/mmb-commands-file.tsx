import React from 'react';
import { View } from '../view';
import { CheckBox } from '../../../common/check-box';
import { PushButton } from '../../../common/push-button';
import { Mmb } from '../../../../refine/mmb';
import { Net } from '../../../../util/net';

interface State {
    includeSequences: boolean;
}
export class MmbCommandsFile extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            includeSequences: false,
        };
    }
    render() {
        const lines = Mmb.commands(this.props.dnatcofication, this.state.includeSequences);

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <div className='rdo-secondary-caption'>MMB commands file</div>
                    <div>Note that this is not a complete MMB commands file but just an excerpt that instructs MMB to apply NtCs to the structure</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--h-gap)' }}>
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
                <div>
                    {lines.map((l, idx) => <div className='rdo-monospace' key={idx}>{l}</div>)}
                </div>
            </div>
        );
    }
}

export namespace MmbCommandsFile {
    export const StepSwitcher = () => {}
}
