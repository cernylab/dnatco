import React from 'react';
import { View } from '../view';
import { PushButton } from '../../../common/push-button';
import { SpinBox } from '../../../common/spin-box';
import { Phenix } from '../../../../refine/phenix';
import { Net } from '../../../../util/net';
import { Globals } from '../../../../globals';

const LeadingWS = new RegExp(/^[ ]./);

function replaceAll(where: string, what: string|RegExp, _with: string) {
    let ret = where;
    while (ret.search(what) >= 0) {
        ret = where.replace(what, _with);
    }

    return ret;
}

interface State {
    maxRmsd: number;
}
export class PhenixRestraints extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            maxRmsd: 0.5,
        };
    }

    render() {
        const restraints = Phenix.restraints(this.props.dnatcofication, this.state.maxRmsd);
        const elems = new Array<JSX.Element>();


        let ctr = 0;
        const lines = Phenix.restraintsAsLines(restraints)
        for (const line of lines) {
            const text = replaceAll(line.text, LeadingWS, '\u00A0');
            if (line.isOk)
                elems.push(<div className='rdo-monospace' key={ctr}>{text}</div>);
            else
                elems.push(<div className='rdo-monospace rdo-error-text' key={ctr}>{text}</div>);

            ctr++;
        }

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <div className='rdo-secondary-caption'>Restraints for NtC-aware Phenix</div>
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
                                Net.serveFile('text/plain', lines.map(l => l.text).join('\n'), `${this.props.dnatcofication.identifyingName}_Phenix_geometry_restraints.txt`);
                            }}
                        />
                    </div>
                </div>
                <div className='rdo-offset' style={{ overflow: 'scroll', flex: 1 }}>
                    {elems}
                </div>
                <div>
                    Note that this restraints file requires a modified &ldquo;NtC-aware&rdquo; version of Phenix. Contact the authors of the {Globals.ProductName} website for further information.
                </div>
            </div>
        );
    }
}

export namespace PhenixRestraints {
    export const StepSwitcher = () => {};
}
