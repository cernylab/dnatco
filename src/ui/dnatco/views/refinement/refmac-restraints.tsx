import React from 'react';
import { Refinement } from './common';
import { View } from '../view';
import { PushButton } from '../../../common/push-button';
import { SpinBox } from '../../../common/spin-box';
import { Refmac } from '../../../../refine/refmac';
import { Net } from '../../../../util/net';

interface State {
    maxRmsd: number;
}
export class RefmacRestraints extends View<View.Props, State> {
    constructor(props: Refinement.Props) {
        super(props);

        this.state = {
            maxRmsd: 0.5,
        };
    }

    render() {
        const restraints = Refmac.restraints(this.props.dnatcofication, this.state.maxRmsd);
        const elems = new Array<JSX.Element>();

        let ctr = 0;
        for (const r of restraints) {
            if (r.rtype === 'unavailable')
                elems.push(<div className='rdo-error-text rdo-monospace' key={ctr}>{Refmac.restraintAsText(r)}</div>);
            else
                elems.push(<div className='rdo-monospace' key={ctr}>{Refmac.restraintAsText(r)}</div>);

            ctr++;
        }

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <div className='rdo-secondary-caption'>Restraints for REFMAC</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--h-gap)' }}>
                        Maximum allowed RMSD:
                        <SpinBox
                            value={this.state.maxRmsd}
                            min={0.1}
                            max={5.0}
                            onChange={v => this.setState({ ...this.state, maxRmsd: v })}
                            step={0.01}
                            formatter={v => v?.toFixed(2) ?? '0'}
                        />
                        <PushButton
                            caption='Download'
                            onClick={() => {
                                const text = Refmac.restraintsAsText(restraints);
                                Net.serveFile('text/plain', text, `${this.props.dnatcofication.identifyingName}_REFMAC_geometry_restraints.txt`);
                            }}
                        />
                    </div>
                </div>
                <div className='rdo-offset' style={{ overflow: 'scroll', flex: 1 }}>
                    {elems}
                </div>
            </div>
        );
    }
}

export namespace RefmacRestraints {
    export const StepSwitcher = () => {};
}
